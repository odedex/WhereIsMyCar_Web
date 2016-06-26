/**
 * Created by OdedA on 25-Jan-16.
 */



var TYPE_FINISH = 'FINISH';
var TYPE_START = 'START';

var SEARCH_ALGORITHMS = {};

var heuristic = new ScoreHeuristic();


function HillClimbSearch() {

    function getNeighbours(node, callback) {

        if (node.isTerminal()) {
            return [];
        }
        // random select a place to add
        var index = Math.floor(Math.random() * (node.pois.length - 1));

        var searchRadius = getSearchRadius(node, index);

        getPOIsAroundLocation(node.pois[index].location, searchRadius, [], false, function (newpois, status) {
            var neighbours = [];
            for (var i = 0; i < newpois.length; i++) {
                var exists = false;
                for (var j = 0; j < node.pois.length; j++) {
                    if (newpois[i].placeID == node.pois[j].placeID) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    var newNode = node.cloneAndInsertNewPOI(index, newpois[i]);
                    if (newNode.timeRemainingHours >= 0) {
                        neighbours.push(newNode);
                    }
                }
            }

            callback(neighbours, index);
        });

    }

    function next(node, callbackOnFinish) {

        if (node.isTerminal()) {
            callbackOnFinish(node);
        }

        getNeighbours(node, function (neighbours, index) {
            var maxScore = null;
            var maxNode = [];
            for (var i = 0; i < neighbours.length; i++) {
                var neighbour = neighbours[i];
                var score = getScore(neighbour, heuristic);
                if (maxScore == null || score > maxScore) {
                    maxNode = [neighbour];
                    maxScore = score;
                } else if (score == maxScore) {
                    maxNode.push(neighbour);
                }

            }
            if (maxNode.length == 0) {
                callbackOnFinish(node);
            } else {

                // update the node to be the a random from the max nodes
                var nextnode = maxNode[Math.floor(Math.random() * maxNode.length)];
                printScores(heuristic.detailedScores(nextnode));
                log("Added location:" + nextnode.pois[index + 1].name);
                //log("scoreFunc:");
                //heuristic.calc(node, true);

                addStepAndMarker(nextnode, index + 1);
                next(nextnode, callbackOnFinish);
            }

        });
    }

    this.searchRoute = function (start, finish, time, callback) {
        // Generate Start node containing a single route
        var spoi = new POI(TYPE_START, start);
        var fpoi = new POI(TYPE_FINISH, finish);
        var distance = getDistance(spoi.location, fpoi.location);

        if (distance.time < time) {
            var node = new Node(time, time, [spoi, fpoi], [distance]);
            next(node, callback);

        } else {
            var errorText = "Distance alone is more than trip time.";
            error(errorText);
            callback(null, error);
        }
    };

    return this;

}


function getSearchRadius(node, index) {
    // distance to closest point
    var tonext = 1000000;
    var toprev = 1000000;
    if (index + 1 < node.pois.length) {
        tonext = getDistance(node.pois[index].location, node.pois[index + 1].location).airDistance;
    }
    if (index != 0) {
        toprev = getDistance(node.pois[index].location, node.pois[index - 1].location).airDistance;
    }
    var mindistancetopoints = Math.min(tonext, toprev);
    var timeDistance = Math.min(node.timeRemainingHours, 4) * KM_PER_HOUR * 1000;

    if (mindistancetopoints < 1000) {
        return timeDistance;
    } else {
        return Math.min(mindistancetopoints, timeDistance);
    }


}

function GeneticSearch() {

    var population = [];
    var generationAge = 0;
    var maxGeneration;

    function prob(num) {
        var rand = Math.floor(Math.random() * 100);
        if (rand < num * 100) {
            return true;
        }
        return false;
    }

    function fitness(node) {
        return node.calcScore();
    }

    function selectFromPopulationWithProb(population) {
        var scores = [];

        for (var i = 0; i < population.length; i++) {
            scores.push(fitness(population[i]));
        }

        var normalizedscores = NormalizeScores(scores);
        var indices = [];
        for (i = 0; i < normalizedscores.length; i++) {
            for (var j = 0; j < normalizedscores[i] * 100; j++) {
                indices.push(i);
            }
        }


        var idx = Math.floor(Math.random() * indices.length);
        return population[indices[idx]];
    }


    function reproduce(x, y) {

        var maxPOIS = Math.max(y.pois.length, x.pois.length);

        // add start poi
        var newpois = [x.pois[0]];

        var remainingTime = x.originalTime;
        var allplaces = [];

        var newArray = $.merge(y.pois.slice(1, y.pois.length - 1), x.pois.slice(1, x.pois.length - 1));
        $.each(newArray, function (i, el) {
            if ($.inArray(el, allplaces) === -1) allplaces.push(el);
        });

        for (i = 0; i < maxPOIS - 2; i++) {
            var index = Math.floor(Math.random() * allplaces.length);
            remainingTime -= allplaces[index].time;
            newpois.push(allplaces[index]);
            allplaces.splice(index, 1);
        }

        // add finish poi
        newpois.push(x.pois[x.pois.length - 1]);

        var distances = [];
        for (i = 0; i < newpois.length - 1; i++) {
            var dis = getDistance(newpois[i].location, newpois[i + 1].location);
            remainingTime -= dis.time;
            distances.push(dis);
        }

        return new Node(x.originalTime, remainingTime, newpois, distances);
    }

    function mutation(node, callback) {
        var index = Math.floor(Math.random() * (node.pois.length - 1));
        var searchRadius = getSearchRadius(node, index);
        getPOIsAroundLocation(node.pois[index].location, searchRadius, [], true, function (newpois, status) {

            var neighbours = [];
            for (var i = 0; i < newpois.length; i++) {
                var exists = false;
                for (var j = 0; j < node.pois.length; j++) {
                    if (newpois[i].placeID == node.pois[j].placeID) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    var newNode = node.cloneAndInsertNewPOI(index, newpois[i]);
                    if (newNode.timeRemainingHours >= 0) {
                        neighbours.push(newNode);
                    }
                }
            }


            if (neighbours.length > 0) {
                var idx = Math.floor(Math.random() * neighbours.length);

                var newChild = neighbours[idx];

                callback(newChild);
            } else { // mutaion failed
                callback(node);
            }

        });
    }

    function nextGeneration(callback) {

        updateProgressBar(generationAge * 100 / maxGeneration + 1);

        log("Generation " + generationAge.toString() + ". Population size: " + population.length.toString());

        if (generationAge > maxGeneration) {
            updateProgressBar(100);
            callback(GetMaxNode(population));
        } else {
            ReproduceCurrentPop([], 0, callback);
        }


    }

    function ReproduceCurrentPop(new_population, curGenerationIndex, callback) {

        var minval = Math.min.apply(Math, [population.length * 1.5, MAX_POPULATION]);
        if (curGenerationIndex >= minval ) {
            generationAge++;
            population = new_population;
            nextGeneration(callback);
            return;
        }

        var x = selectFromPopulationWithProb(population);
        var y = selectFromPopulationWithProb(population);
        var child = reproduce(x, y);

        var mutationProb = Math.pow(1 - (generationAge / maxGeneration), 2);
        if (prob(mutationProb)) {
            mutation(child, function x(newChild) {
                var updated = [].concat(new_population);
                updated.push(newChild);
                ReproduceCurrentPop(updated, curGenerationIndex + 1, callback);
            });
            // TODO: Remove a point
        } else {
            new_population.push(child);
            ReproduceCurrentPop(new_population, curGenerationIndex + 1, callback);
        }

    }

    this.searchRoute = function (start, finish, time, callback) {
        // Generate Start node containing a single route
        var spoi = new POI(TYPE_START, start);
        var fpoi = new POI(TYPE_FINISH, finish);
        var distance = getDistance(spoi.location, fpoi.location);
        maxGeneration = Math.min(time * HOURS_TO_GENERATION_CONVERSION, 120);

        if (distance.time < time) {
            var node = new Node(time, time, [spoi, fpoi], [distance]);
            population.push(node);
            population.push(node);
            nextGeneration(function x(node) {
                callback(node)
            });

        } else {
            var errorText = "Distance alone is more than trip time.";
            error(errorText);
            callback(null, error);
        }

    };


}

SEARCH_ALGORITHMS["Hill Climb Search"] = HillClimbSearch;
SEARCH_ALGORITHMS["Genetic Search"] = GeneticSearch;


function GetMaxNode(nodes) {
    var maxScore = null;
    var maxNode = [];
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var score = node.calcScore();
        if (maxScore == null || score > maxScore) {
            maxNode = [node];
            maxScore = score;
        } else if (score == maxScore) {
            maxNode.push(node);
        }

    }

    return maxNode[Math.floor(Math.random() * maxNode.length)];
}

function Node(originalTime, time, pois, distances) {
    this.pois = pois;
    this.distances = distances;
    this.originalTime = originalTime;
    this.timeRemainingHours = time;
    this.scoreFunc = null;


    this.isTerminal = function x() {
        return this.timeRemainingHours <= 0;
    };

    this.calcScore = function x() {
        if (this.scoreFunc == null) {
            this.scoreFunc = getScore(this, heuristic);
        }
        return this.scoreFunc;
    };

    this.cloneAndInsertNewPOI = function (index, poi) {
        var newpois = [].concat(this.pois);
        newpois.splice(index + 1, 0, poi);
        var newDistances = [].concat(this.distances);
        var oldTime = newDistances[index].time;
        newDistances[index] = getDistance(newpois[index].location, newpois[index + 1].location);
        newDistances.splice(index + 1, 0, getDistance(newpois[index + 1].location, newpois[index + 2].location));

        // returns the time it took from index i to i+1 to the time remaining, and subtract the 2 new additional times.
        var newtime = this.timeRemainingHours + oldTime - newDistances[index].time - newDistances[index + 1].time - poi.time;

        return new Node(this.originalTime, newtime, newpois, newDistances);

    };

    this.cloneAndSwapIndexes = function (index1, index2) {
        var newpois = [].concat(this.pois);

        // swap 2 POIs
        var tempPOI = newpois[index1];
        newpois[index1] = newpois[index2];
        newpois[index2] = tempPOI;

        var newDistances = [];
        var newTime = 0;

        // sum the time spent in each POI
        newpois.forEach(function (poi) {
            newTime += poi.time;
        });

        // compute all the distance between each poi, and sum the additional travel times.
        for (var i = 0; i < newpois.length - 1; i++) {
            newDistances[i] = getDistance(newpois[i].location, newpois[i + 1].location);
            newTime += newDistances[i].time;
        }

        return new Node(this.originalTime, this.originalTime - newTime, newpois, newDistances);
    };

    return this;
}

function getScore(node, heuristic) {
    return heuristic.calc(node);

}

function addStepAndMarker(nextnode, index) {
    var marker = createMarker(nextnode.pois[index], map, index);
    addRouteStep(nextnode.pois[index], index, marker, nextnode.timeRemainingHours, nextnode.originalTime);
}
