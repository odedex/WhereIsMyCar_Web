# Where is my Car? - Raspberry PI project for locating your vehicle.

This is a final project of the Hebrew University course 67788 ADVANCED OPERATING SYSTEMS & CLOUD TECHNOLOGIES by
prof. Danny Dolev and dr. Yaron Weinsberg.
The project is composed of 3 parts: a web client, a server and a raspberry pi code.

## Compile and installation
Download the Raspberry Pi installer to your Pi device, which should be running an OS supporting python.
Register your device on the web client and you are good to go!

## Usage
### Registering your device.
0. Make sure your PI has a valid internet connection before starting.
1. Head over to https://wheremycarwebserver.eu-gb.mybluemix.net/devices and register a new account.
2. After registration, prepare your device for pairing up by clicking the correct button (see appendix)
3. The PI's screen will show a random number that can only be used at the time frame of registration; type that number into
the ID input of the device registration and give it a friendly name that will help you remember which device is it.
4. Upon clicking "Add Device" the server will now wait for you to click the 2nd button on the PI (see appendix) that will
complete the pairing process.

### Setting up your device
After registration, your device will enter beacon mode. During that mode, your device will continuously send its' GPS data
along with a timestamp to the server. Should your device internet connection or run out of battery, your device will resume 
normal operation the moment these problems are fixed.

### Unpairing a device
In order to re-set a device, click the 3rd button (see appendix). The history of the device will not be deleted and can still 
be viewed, but the device can now be paired to a new user and/or given a new name.

## Contibute
you are more than welcome to fork the code and edit it!
