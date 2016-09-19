import os

class deviceId:
	
	def __init__(self):
		self.filepath = "/home/pi/findmycar/id"
		pass
		
	def hasId(self):
		return os.path.isfile(self.filepath)
		
	def getId(self):
		if self.hasId():
			with open(self.filepath) as f:
				return f.readline()
	
	def removeId(self):
		if self.hasId():
			os.remove(self.filepath) 
	
	def setId(self, newId):
		with open(self.filepath, 'w') as f:
			f.write(newId)
		
	
	
