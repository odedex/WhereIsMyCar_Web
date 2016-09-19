import pynmea2
import subprocess
import csv   
import requests
import os
from time import sleep
import pifacecad
from deviceId import deviceId
import random
import socket
import thread


filename = "/home/pi/findmycar/nmeaout.txt";
csvfilename = "/home/pi/findmycar/offline.txt"
postGpsUrl = "http://wheremycarwebserver.eu-gb.mybluemix.net/update/{0}/{1}/{2}/{3}"
registrationUrl = "http://wheremycarwebserver.eu-gb.mybluemix.net/register/{0}"
outdatfile = open(filename, 'w+')
UDP_IP = "127.0.0.1"
UDP_PORT = 20176

UPDATE_INTERVAL = 15
INTERNET_UPDATE_INTERVAL = 5
WARMING_UP = 2

cad = pifacecad.PiFaceCAD()
myId = None

def LCDwrite(text):
	cad.lcd.clear()
	cad.lcd.write(text)

def init():
	cad.lcd.blink_off()
	cad.lcd.cursor_off()
	cad.lcd.backlight_on()
	
	
	if not os.path.isfile(csvfilename):
		with open(csvfilename, 'w+') as r:
			pass

	# waiting for startup

	cad.lcd.clear()
	i = 0
	while i < WARMING_UP: # cad.switches[3].value == 0:
		i+=1
		LCDwrite("warming up\n" + str(i))
		sleep(1)
	deviceIdHandler = deviceId()
	
	while not deviceIdHandler.hasId():
		regKey = str(random.randrange(100000,999999))
		# display and wait for registration status
		LCDwrite("please register.\n code: " + regKey)
		while cad.switches[0].value == 0:
			sleep(1)
		# get registration id
		LCDwrite("Registering to service")
		r = requests.get(registrationUrl.format(regKey))
		if r.status_code == 200:
			#r.text.strip()
			deviceIdHandler.setId(r.text.strip())
		else:
			LCDwrite("invalid registration.\n try again")
			sleep(3)


	device_id = deviceIdHandler.getId()
	return device_id
	

def ReadGPS():

	adb = subprocess.Popen(['sudo', 'adb','forward','tcp:20176','tcp:50000'],\
			stdout=subprocess.PIPE,stderr=subprocess.PIPE)

	sleep(6)
	sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	sock.connect((UDP_IP, UDP_PORT))
	try:
		LCDwrite("Connected To Device")
	except:
		LCDWrite("Device Connection\nError. Sleeping")
		sleep(10)
		return "DeviceError"


	if cad.switches[1].value == 0:
		LCDwrite("Waiting for GPS")
		

		if cad.switches[4].value == 1:
			i = 0
			LCDwrite("Keep Holding\nfor RESET")
			while i < 5 and cad.switches[4].value == 1:
				sleep(1)
				i+=1
				LCDwrite("reset in " + str(5-i))
			
			deviceIdHandler.removeId()
			print "removed"
			LCDwrite("RESET completed")
			return "RESET"
			
		try:
			data, addr = sock.recvfrom(1024) # buffer size is 1024 bytes
			for line in data.split('\n'):
				line = line.strip()
				try:
					msg = pynmea2.parse(line)
					if type(msg) is pynmea2.types.talker.RMC:
						print msg.latitude
						print msg.longitude
						print msg.timestamp
						print msg.datestamp

						LCDwrite(str(msg.latitude) + "\n" + str(msg.longitude))

						with open(csvfilename, 'a+') as r:
							strdatetime = "{0}-{1}-{2}-{3}".format(msg.datestamp.month, msg.datestamp.day, msg.datestamp.year, str(msg.timestamp))
							print strdatetime
							url = postGpsUrl.format(myId, strdatetime, msg.latitude, msg.longitude)
							r.write(url + "\n")
				except: #  pynmea2.ParseError
					pass
		except:
			LCDwrite("socket error")
		

def executeServerPush():
	while True:
		try:
			newlines = []
			with open(csvfilename, 'r+') as r:
				lines = r.readlines()
				for line in lines:
					r = requests.get(line)
					if r.status_code != 200:
						newlines.append(line)
			with open(csvfilename, 'w+') as r:
				r.writelines(newlines)
			sleep(INTERNET_UPDATE_INTERVAL)
		except:
			print "internet error"
			LCDwrite("internet error")
			
			
if __name__ == "__main__":
	myId = init()
	thread.start_new_thread(executeServerPush, ())
	while True:
		if ReadGPS() == "RESET":
			init()
		else:
			sleep(UPDATE_INTERVAL)
