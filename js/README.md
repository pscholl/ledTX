ledTX - data transmission via webcam/HTML5 
==========================================

 This javascript and arduino example allows to transmit data from an LED
attached to an Arduino to a PC via the webrtc mechanism of current webbrowser.
Data is encoded in an amplitude keying fashion, i.e. if the LED is off a '0' is
transmitted and LED on means a '1' is transmitted. This provides a cheap way
to interface your Arduino project to a PC for data download.

 The bandwidth is currently limited by the framerate of the attached webcam, which
ranges from 17-30 FPS. A robust transmission of 4.5 bits per second can be achieved
at the moment.

Setup
-----

 Attach an LED to any Arduino board and upload the provided sketch, it will start
to blink out the characters from the 'data' array.

 The javascript software needs to synchronize to the bits in a byte, which is why
you need to provide a start character in the javascript (the START_CHAR constant).
Furthermore you need to configure the transmission rate (SEND_FREQ), which defaults
to 4.5 Hz. The MINIMUM_PIXELS constant defines the number of pixels with
a luminosity > .8 to detect a turned on LED.

 Now visit the provided index.html, either locally or directly on [githunb]() and
hold the LED in the small highlighted rectangular area to transmit your data.

 You can furthermore use either a luminosity treshold detector or a chromakey
based one. The chromakey one is enabled by default, as it is more robust however
the MINIMUM_PIXELS constant needs to be set properly. Also note that the simple
delay() call in the Arduino sample is too inexact for larger transmissions.

Usage
-----

 You need to server the .js file and .html file from a webserver, since
most webbrowser do not allow webcam-usage from file:// urls. If you have
python installed you can start a webserver with the following command:
 
 $ python -m http.server 8080

or for python2
 
 $ python2 -m SimpleHTTPServer 8080

and point your browser http://locahost:8080/index.html

Contact
-------

If you have any questions, don't hesitate to contact me. If you're using this work
in your academic project please cite the following paper:

```
@inproceedings{scholl2013bridging,
  title={Bridging the last gap: LedTX-optical data transmission of sensor data for web-services},
  author={Scholl, Philipp M and K{\"u}c{\"u}kyildiz, Nagihan and Van Laerhoven, Kristof},
  booktitle={Proceedings of the 2013 ACM conference on Pervasive and ubiquitous computing adjunct publication},
  pages={47--50},
  year={2013},
  organization={ACM}
}
```
