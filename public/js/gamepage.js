
$(function () {

    // getting the gameID of the room from the url
    var id = Number(window.location.pathname.match(/\/game\/(\d+)$/)[1]);


    var timeinterval;

    // connect to the socket
    var socket = io();

    // variables which hold the data for each person
    var name = "",
        email = "",
        img = "",
        friend = "";

    // cache some jQuery objects
    var section = $(".section"),
        footer = $("footer"),
        onConnect = $(".connected"),
        inviteSomebody = $(".invite-textfield"),
        personInside = $(".personinside"),
        gameScreen = $(".chatscreen"),
        left = $(".left"),
        ended = $(".game-ended"),
        noMessages = $(".nomessages"),
        tooManyPeople = $(".toomanypeople");

    // some more jquery objects
    var chatNickname = $(".nickname-chat"),
        leftNickname = $(".nickname-left"),
        loginForm = $(".loginForm"),
        yourName = $("#yourName"),
        gameLines = $("#gameLines"),
        yourEmail = $("#yourEmail"),
        hisName = $("#hisName"),
        hisEmail = $("#hisEmail"),
        chatForm = $("#chatform"),
        textarea = $("#message"),
        messageTimeSent = $(".timesent"),
        players = $("#players"),
        fullstory = $("#fullstory"),
        chats = $(".chats");

    var onGoing = true;

    // these variables hold images
    var ownerImage = $("#ownerImage"),
        leftImage = $("#leftImage"),
        noMessagesImage = $("#noMessagesImage");

    var myturn;

    var getTimeRemaining = function getTimeRemaining(endtime) {
        var t = Date.parse(endtime) - Date.parse(new Date());
        var seconds = Math.floor((t / 1000) % 60);
        var minutes = Math.floor((t / 1000 / 60) % 60);
        var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        return {
            'total': t,
            'days': days,
            'hours': hours,
            'minutes': minutes,
            'seconds': seconds
        };
    };

    var initializeClock = function initializeClock(id, endtime) {

        clearInterval(timeinterval);
        var clock = document.getElementById(id);
        var minutesSpan = clock.querySelector('.minutes');
        var secondsSpan = clock.querySelector('.seconds');

        function updateClock() {
            var t = getTimeRemaining(endtime);

            minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
            secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

            if (t.total <= 0) {
                clearInterval(timeinterval);
            }
        }

            updateClock();
        timeinterval = setInterval(updateClock, 1000);
    };



    var updatePlayers = function(users, next){

        var turnLen = 120;
        var deadline = new Date(Date.parse(new Date()) + turnLen * 1000);
        initializeClock('clockdiv', deadline);

        $('audio')[0].play();

        if (next === name){
            chatForm.fadeIn(200);
            myturn = true;
        } else {
            chatForm.fadeOut(200);
            myturn = false;
        }
        players.empty();
        users.forEach(function (curr) {

            if (next === curr) {
                var p = $(
                    '<p><b>' + curr + '</b></p>'
                );
            }
            else {
                var p = $(
                    '<p>' + curr + '</p>'
                );
            }

            // use the 'text' method to escape malicious user input

            players.append(p);

        });
    };


    // on connection to server get the id of person's room
    socket.on('connect', function () {
        socket.emit('load', {id:id, username: name});
    });

    socket.on('waitload', function(){
        setTimeout(function () {
            socket.emit('load', {id:id, username: name});
        }, 2000);
    });



    // receive the names and of all people in the game
    socket.on('peopleingame', function (data) {


        if (data.number === 0) {
            if (name == ""){
                showMessage("connected");
            }

            loginForm.on('submit', function (e) {

                e.preventDefault();

                name = $.trim(yourName.val());
                var lines = parseInt($.trim(gameLines.val()));

                if (name.length < 1) {
                    alert("Please enter a nick name longer than 1 character!");
                    return;
                }

                else {

                    showMessage("inviteSomebody");

                    // call the server-side function 'login' and send user's parameters
                    socket.emit('login', {user: name, id: id, gameLines:lines});

                }

            });
        }

        else {

            showMessage("personingame", data);

            loginForm.on('submit', function (e) {

                e.preventDefault();

                name = $.trim(hisName.val());

                if (name.length < 1) {
                    alert("Please enter a nick name longer than 1 character!");
                    return;
                }

                if (name === data.user || ( data.players != undefined && data.players.indexOf(name) != -1)) {
                    alert("There already is a \"" + name + "\" in this room!");
                    return;
                }

                socket.emit('login', {user: name, id: id});


            });
        }

    });

    // Other useful

    socket.on('startGame', function (data) {

        if (data.boolean && data.id == id) {



            if (name === data.users[0]) {

                showMessage("youStartedGameWithNoMessages", data);
            }
            else {

                showMessage("heStartedGameWithNoMessages", data);
            }



            updatePlayers(data.users, data.currUser);

            chatNickname.text(friend);
        }
    });

    socket.on('myend', function (data) {
        showMessage('myend', data);

    });
    

    socket.on('nextturn', function (data) {



        updatePlayers(data.users, data.nextUser);

    });

    //});

    socket.on('receive', function (data) {

        showMessage('gameStarted');

        if (data.msg.trim().length) {
            if (myturn) {
                createMessage(data.msg, data.user, data.img, moment());
            } else {
                createMessage("\<hidden message\>", data.user, data.img, moment());
            }
            scrollToBottom();
        }
    });

    textarea.keypress(function (e) {

        // Submit the form on enter

        if (e.which == 13) {
            e.preventDefault();
            chatForm.trigger('submit');
        }

    });

    chatForm.on('submit', function (e) {

        e.preventDefault();

        // Create a new chat message and display it directly

        showMessage("gameStarted");

        if (textarea.val().trim().length) {
            createMessage(textarea.val(), name, img, moment());
            scrollToBottom();

            // Send the message to the other person in the chat
            socket.emit('msg', {msg: textarea.val(), user: name, img: img});

        }
        // Empty the textarea
        textarea.val("");
    });

    // Update the relative time stamps on the chat messages every minute

    setInterval(function () {

        messageTimeSent.each(function () {
            var each = moment($(this).data('time'));
            $(this).text(each.fromNow());
        });

    }, 60000);

    // Function that creates a new chat message

    function createMessage(msg, user, imgg, now) {

        var who = '';

        if (user === name) {
            who = 'me';
        }
        else {
            who = 'you';
        }

        var li = $(
            '<li class=' + who + '>' +
            '<div class="image">' +
            '<img src="../img/unnamed.jpg" />' +
            '<b></b>' +
            '<i class="timesent" data-time=' + now + '></i> ' +
            '</div>' +
            '<p></p>' +
            '</li>');

        // use the 'text' method to escape malicious user input
        li.find('p').text(msg);
        li.find('b').text(user);

        chats.empty();
        chats.append(li);

        messageTimeSent = $(".timesent");
        messageTimeSent.last().text(now.fromNow());
    }

    function scrollToBottom() {
        $("html, body").animate({scrollTop: $(document).height() - $(window).height()}, 1000);
    }

    function isValid(thatemail) {

        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(thatemail);
    }

    function showMessage(status, data) {

        if (!onGoing){
            return;
        }

        ended.css('display', 'none');

        if (status === "connected") {

            section.children().css('display', 'none');
            onConnect.fadeIn(1200);
        }

        else if (status === 'myend') {
            onGoing = false;
            section.children().css('display', 'none');
            gameScreen.css('display', 'none');
            footer.css('display', 'none');
            ended.css('display', 'inline');

            var all = "";

            data.messages.forEach(function (m){
                all +='<p>' + m.msg + '</p>';

            });

            $("#fullstory").html(all);

        }

        else if (status === "inviteSomebody") {

            // Set the invite link content
            $("#link").text(window.location.href);

            onConnect.fadeOut(1200, function () {
                inviteSomebody.fadeIn(1200);
            });
        }

        else if (status === "personingame") {

            onConnect.css("display", "none");
            personInside.fadeIn(1200);

            chatNickname.text(data.user);

        }

        else if (status === "youStartedGameWithNoMessages") {

            onConnect.css("display", "none");
            left.fadeOut(1200, function () {
                inviteSomebody.fadeOut(1200, function () {
                    //noMessages.fadeIn(1200);
                    footer.fadeIn(1200);

                });
            });

            friends = data.users.join();

        }

        else if (status === "heStartedGameWithNoMessages") {

            onConnect.css("display", "none");
            personInside.fadeOut(1200, function () {
                //noMessages.fadeIn(1200);
                footer.fadeIn(1200);


            });

            friends = data.users.join();




        }

        else if (status === "gameStarted") {

            section.children().css('display', 'none');
            gameScreen.css('display', 'block');
        }

        else if (status === "somebodyLeft") {


            leftNickname.text(data.user);

            section.children().css('display', 'none');
            footer.css('display', 'none');
            left.fadeIn(1200);
        }

        else if (status === "tooManyPeople") {

            section.children().css('display', 'none');
            tooManyPeople.fadeIn(1200);
        }
    }

});
