$(window).load(function() {
  "use strict";

  var video  = document.getElementById('webcam');
  var canvas = document.getElementById('canvas');
  var roiel  = document.getElementById('roi');
  var stat   = new profiler();
  var img;

  /* get the video canvas element */
  var width,height,ctx, roi;

  var SEND_FREQ = 4.25,      // in Hz
      MINIMUM_PIXELS = 80,  // minimal amount of pixels for a 1
      START_CHAR     = 'h',
      CHROMA_KEYING  = 1,    // use chroma keying to detect bits
      LUMINOSITY_TRESHOLD = .7; // only applies when CHROMA_KEYING=0

  try {
    compatibility.getUserMedia({video: true}, function(stream) {
      try {
        video.src = compatibility.URL.createObjectURL(stream);
      } catch (error) {
        video.src = stream;
      }
      setTimeout(function() {
        video.play();

        height = canvas.height;
        width  = canvas.width;
        ctx = canvas.getContext('2d');

        roi = { x: parseInt(roiel.style.left),
                y: parseInt(roiel.style.top),
                width:  parseInt(roiel.style.width),
                height: parseInt(roiel.style.height) };

        logln("waiting for start marker");
        compatibility.requestAnimationFrame(ledrx);
      }, 500);
    }, function (error) {
      $('#canvas').hide();
      $('#log').hide();
      $('#no_rtc').html(error+'<h4>WebRTC not available.</h4>');
      $('#no_rtc').show();
    });
  } catch (error) {
    $('#canvas').hide();
    $('#log').hide();
    $('#no_rtc').html('<h4>Something went wrong...</h4>');
    $('#no_rtc').show();
  }

  var logln = function(msg) { msg += "<br/>"; log(msg); }
  var logs = function(msg) { var el = $("#log"); el.html(el.html()+msg); }
  var log = function(msg) { var el = $("#log"); el.html(msg+el.html()); }

  /* this function detects if the LED with a certain color is turned on or in
   * the current frame, i.e. bits are transmitted in amplitude shift keying */
  function chromakey(keys, frame_length)
  {
    /* convert all keys to HSL */
    for (var i=0; i<keys.length; i++)
    {
      var key = keys[i];
      if (typeof key.color.h == "undefined") {
        key.color = key.color.toHsl();
        key.color.h /= 360;
      }
      key.sample_buffer.unshift( { num_pixels:0, time:frame_length } );
    }

    /* convert each pixel in the ROI to HSL, and run the bit detector */
    for (var i=0; i<img.data.length; i+=4)
    {
      var r=img.data[i]/255,
          g=img.data[i+1]/255,
          b=img.data[i+2]/255;

      /* rgb to hsl, here for performance */
      var max = Math.max(r,g,b), min = Math.min(r,g,b);
      var h,s,l = (max+min) / 2;

      if (max==min) {
        h = s = 0; // achromatic
      }
      else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
      }

      for (var j=0; j<keys.length; j++)
      {
        var key = keys[j];

        if (CHROMA_KEYING) {
          if ( (Math.abs(h - key.color.h) < key.sensitivity) &&
                l > .4 && s > .3 && s < .6 && l <.6 ) {
            key.sample_buffer[0].num_pixels++;
            img.data[i]   = 0;
            img.data[i+1] = 0;
            img.data[i+2] = 255;
            img.data[i+3] = 255;
          }
        } else if ( l > LUMINOSITY_TRESHOLD )
        {
          key.sample_buffer[0].num_pixels++;
          img.data[i]   = 0;
          img.data[i+1] = 0;
          img.data[i+2] = 255;
          img.data[i+3] = 255;
        }
      }
    }
  }

  function decode(keys) {
    for (var i=0; i<keys.length; i++) {
      var key = keys[i];
      var symbol = key.sample_buffer[0].num_pixels > MINIMUM_PIXELS;

      if (CHROMA_KEYING) symbol = !symbol;

      if (typeof key.current_symbol == "undefined") {
        key.current_symbol = symbol;
        key.data = new Array(0);
      }

      // do we have a signal transition?
      if (symbol != key.current_symbol) {
        var elapsed_time = 0;
        var sample_len   = key.sample_buffer.length;

        for (var j=1; j< sample_len; j++) {
          var sample = key.sample_buffer.pop();
          elapsed_time += sample.time;
        }

        var num_symbols = Math.round( elapsed_time / (1/SEND_FREQ) );

        while (num_symbols--)
          key.data.unshift( key.current_symbol );

        key.current_symbol = symbol;
        key.sample_buffer  = key.sample_buffer.slice(0,2); // leave only the first element
      }
    }
  }

  function getchar(key) {
    var str = "";
    if (key.data.length<8)
      return -1;
    for (var k=7; k>0; k--)
      str += key.data[key.data.length-k-1] ? "1" : "0";
    //logln(str);
    return parseInt(str,2);
  }

  var keys = [ {color:tinycolor('green'), sensitivity: .2, sample_buffer: new Array(0)} ],
      last_time = new Date(),
      startseen = 0;

  function ledrx() {
    if (video.currentTime - last_time > (1/SEND_FREQ))
    {
      logln("sample frame rate too low to decode transmission, giving up!");
      return;
    }

    compatibility.requestAnimationFrame(ledrx);

    if (video.currentTime == last_time)
      return; /* only look at new frames */

    if (video.currentTime < last_time) {
      last_time = video.currentTime;
      return;
    }

    /* keep a record of the last captured frame */
    stat.new_frame();

    /* draw the new frame */
    ctx.drawImage(video, 0,0,width,height);
    img = ctx.getImageData(roi.x,roi.y,roi.width,roi.height);

    /* chromakey the single leds out of the image, the sampled data
     * ends up in the sample_buffer var. */
    //chromakey([ {color:tinycolor('green'), sensitivity: .2},
    //            {color:tinycolor('red'), sensitivity: .2} ]);
    chromakey(keys, video.currentTime-last_time);

    /* draw a debug image */
    ctx.putImageData(img, roi.x,roi.y);

    // for debugging
    //logln(keys[0].sample_buffer[0].time+ ","+keys[0].sample_buffer[0].num_pixels);

    /* decode the amplitude shift keying */
    decode(keys);

    /* here we assume that there is only one key! */
    var key = keys[0];
    var chr = getchar(key);

    if (chr < 0) {
      last_time = video.currentTime;
      $('#stat').html(stat.log());
      return;
    }

    if (!startseen)
      startseen = (chr==START_CHAR.charCodeAt(0)); // 'h' is the start symbol

    if (!startseen)
      key.data.pop(); // remove one bit from the stream and retry
    else {
      logs(String.fromCharCode(chr)); // print character and remove one byte from the stream
      for (var k=0; k<8; k++)
        key.data.pop();
    }

    last_time = video.currentTime;
    $('#stat').html(stat.log());
  }
});

$(window).unload(function() {
  video.pause();
  video.src=null;
});
