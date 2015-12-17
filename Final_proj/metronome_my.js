var audioContext = null;
var isPlaying = false;      // Are we currently playing?
var startTime;              // The start time of the entire sequence.
var currentLastNote;        // What note is currently last scheduled?
var tempo = 120.0;          // tempo (in beats per minute)
var lookahead = 25.0;       // How frequently to call scheduling function 
                            //(in milliseconds)
var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
                            // This is calculated from lookahead, and overlaps 
                            // with next interval (in case the timer is late)
var nextNoteTime = 0.0;     // when the next note is due.
var noteResolution = 0;     // 0 == 16th, 1 == 8th, 2 == quarter note
var tempoBase = 0;          // 0 == 4 Beats, 1 == 3 Beats
var noteLength = 0.05;      // length of "beep" (in seconds)
var intervalID = 0;         // setInterval identifier.

var canvas,                 // the canvas element
    ctx;          // ctx is the canvas' context 2D
var last16thNoteDrawn = -1; // the last "box" we drew on the screen
var notesInQueue = [];      // the notes that have been put into the web audio,
                            // and may or may not have played yet. {note, time}
var secondsPerBeat;
var currentLastNote_temp;
var afterTime = 0;
var time_diff = 0;
// First, let's shim the requestAnimationFrame API, with a setTimeout fallback
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function( callback ){
        window.setTimeout(callback, 1000 / 60);
    };
})();

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var raf;
var running = false;

var ball_1 = {
  x: 0,
  y: canvas.height / 2,
  vx: 0,
  vy: 0,
  radius: 20,
  color: 'red',
  dir : 0,
  draw: function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }
};

var ball_2 = {

  x: canvas.width / 8,
  y: canvas.height / 2,
  vx: 0,
  vy: 0,
  radius: 20,
  color: 'black',
    dir : 1,
  draw: function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }
};

var ball_3 = {
  x: canvas.width / 8 * 2,
  y: canvas.height / 2,
  vx: 0,
  vy: 0,
  radius: 20,
  color: 'black',
    dir : 1,
  draw: function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }
};

var ball_4 = {
  x: canvas.width / 8 * 3,
  y: canvas.height / 2,
  vx: 0,
  vy: 0,
  radius: 20,
  color: 'black',
    dir : 1,
  draw: function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }
};

var ball_5 = {
  x: canvas.width / 6 * 1,
  y: canvas.height / 2,
  vx: 0,
  vy: 0,
  radius: 20,
  color: 'black',
    dir : 1,
  draw: function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }
};

var ball_6 = {
  x: canvas.width / 6 * 2,
  y: canvas.height / 2,
  vx: 0,
  vy: 0,
  radius: 20,
  color: 'black',
    dir : 1,
  draw: function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  }
};

function animate(){
    ctx.clearRect(0,0, canvas.width, canvas.height);


    if (tempoBase == 0){

        if (noteResolution == 0){
            ball_1.draw();
            ball_2.draw();
            ball_3.draw();
            ball_4.draw();

            if (ball_1.x > canvas.width || ball_1.x < 0){
                if (ball_1.dir == 0)
                    ball_1.dir = 1;
                else
                    ball_1.dir = 0;
            }
            if (ball_2.x > canvas.width || ball_2.x < 0){
                if (ball_2.dir == 0)
                    ball_2.dir = 1;
                else
                    ball_2.dir = 0;
            }
            if (ball_3.x > canvas.width || ball_3.x < 0){
                if (ball_3.dir == 0)
                    ball_3.dir = 1;
                else
                    ball_3.dir = 0;
            }
            if (ball_4.x > canvas.width || ball_4.x < 0){
                if (ball_4.dir == 0)
                    ball_4.dir = 1;
                else
                    ball_4.dir = 0;
            }

            if (currentLastNote_temp - currentLastNote != 0){
                if (currentLastNote%8==1)
                ball_1.x = 0;
            else if (currentLastNote%8==5)
                ball_1.x = canvas.width;
            else if (currentLastNote%8==2)
                ball_2.x = 0;
            else if (currentLastNote%8==6)
                ball_2.x = canvas.width;
            else if (currentLastNote%8==3)
                ball_3.x = 0;
            else if (currentLastNote%8==7)
                ball_3.x = canvas.width;
            else if (currentLastNote%8==4)
                ball_4.x = 0;
            else if (currentLastNote%8==0)
                ball_4.x = canvas.width;
            }

            if (ball_1.dir == 0){
                    ball_1.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_1.vx = -canvas.width/(secondsPerBeat);}
            if (ball_2.dir == 0){
                    ball_2.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_2.vx = -canvas.width/(secondsPerBeat);}
            if (ball_3.dir == 0){
                    ball_3.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_3.vx = -canvas.width/(secondsPerBeat);}
            if (ball_4.dir == 0){
                    ball_4.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_4.vx = -canvas.width/(secondsPerBeat);}

            time_diff = (audioContext.currentTime - afterTime);
            ball_1.x += ball_1.vx  * (0.0172);
            ball_2.x += ball_2.vx  * (0.0172);
            ball_3.x += ball_3.vx  * (0.0172);
            ball_4.x += ball_4.vx  * (0.0172);


            // the value should be (audioContext.currentTime - afterTime)
            // but its value sometimes discontinuously changes
            // so I set the value which is appropriate to my computer
        }


        else if (noteResolution == 1){
            ball_1.draw();
            ball_3.draw();

            if (ball_1.x > canvas.width || ball_1.x < 0){
                if (ball_1.dir == 0)
                    ball_1.dir = 1;
                else
                    ball_1.dir = 0;
            }
            if (ball_3.x > canvas.width || ball_3.x < 0){
                if (ball_3.dir == 0)
                    ball_3.dir = 1;
                else
                    ball_3.dir = 0;
            }
            if (currentLastNote_temp - currentLastNote != 0){
                if (currentLastNote%8==1)
                ball_1.x = 0;
            else if (currentLastNote%8==5)
                ball_1.x = canvas.width;
            else if (currentLastNote%8==3)
                ball_3.x = 0;
            else if (currentLastNote%8==7)
                ball_3.x = canvas.width;
            }

            if (ball_1.dir == 0){
                    ball_1.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_1.vx = -canvas.width/(secondsPerBeat);}
            if (ball_3.dir == 0){
                    ball_3.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_3.vx = -canvas.width/(secondsPerBeat);}

            ball_1.x += ball_1.vx  * (0.0172);
            ball_3.x += ball_3.vx  * (0.0172);

        }

        else if (noteResolution == 2){
            ball_1.draw();

            if (ball_1.x > canvas.width || ball_1.x < 0){
                if (ball_1.dir == 0)
                    ball_1.dir = 1;
                else
                    ball_1.dir = 0;
            }

            if (currentLastNote_temp - currentLastNote != 0){
                if (currentLastNote%8==1)
                ball_1.x = 0;
            else if (currentLastNote%8==5)
                ball_1.x = canvas.width;;
            }

            if (ball_1.dir == 0){
                    ball_1.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_1.vx = -canvas.width/(secondsPerBeat);}

            ball_1.x += ball_1.vx  * (0.0172);

        }
        }
        else if(tempoBase == 1){
        if (noteResolution == 3){
            ball_1.draw();
            ball_5.draw();
            ball_6.draw();

            if (ball_1.x > canvas.width || ball_1.x < 0){
                if (ball_1.dir == 0)
                    ball_1.dir = 1;
                else
                    ball_1.dir = 0;
            }
            if (ball_5.x > canvas.width || ball_5.x < 0){
                if (ball_5.dir == 0)
                    ball_5.dir = 1;
                else
                    ball_5.dir = 0;
            }
            if (ball_6.x > canvas.width || ball_6.x < 0){
                if (ball_6.dir == 0)
                    ball_6.dir = 1;
                else
                    ball_6.dir = 0;
            }

            if (currentLastNote_temp - currentLastNote != 0){
                if (currentLastNote%6==1)
                ball_1.x = 0;
            else if (currentLastNote%6==4)
                ball_1.x = canvas.width;
            else if (currentLastNote%6==2)
                ball_5.x = 0;
            else if (currentLastNote%6==5)
                ball_5.x = canvas.width;
            else if (currentLastNote%6==3)
                ball_6.x = 0;
            else if (currentLastNote%6==0)
                ball_6.x = canvas.width;
            }

            if (ball_1.dir == 0){
                    ball_1.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_1.vx = -canvas.width/(secondsPerBeat);}
            if (ball_5.dir == 0){
                    ball_5.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_5.vx = -canvas.width/(secondsPerBeat);}
            if (ball_6.dir == 0){
                    ball_6.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_6.vx = -canvas.width/(secondsPerBeat);}

            ball_1.x += ball_1.vx  * (0.0172);
            ball_5.x += ball_5.vx  * (0.0172);
            ball_6.x += ball_6.vx  * (0.0172);

        }
        else if (noteResolution == 4){
            ball_1.draw();
            ball_6.draw();

            if (ball_1.x > canvas.width || ball_1.x < 0){
                if (ball_1.dir == 0)
                    ball_1.dir = 1;
                else
                    ball_1.dir = 0;
            }
            if (ball_6.x > canvas.width || ball_6.x < 0){
                if (ball_6.dir == 0)
                    ball_6.dir = 1;
                else
                    ball_6.dir = 0;
            }


            if (currentLastNote_temp - currentLastNote != 0){
                if (currentLastNote%6==1)
                ball_1.x = 0;
            else if (currentLastNote%6==4)
                ball_1.x = canvas.width;
            else if (currentLastNote%6==3)
                ball_6.x = 0;
            else if (currentLastNote%6==0)
                ball_6.x = canvas.width;}


            if (ball_1.dir == 0){
                    ball_1.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_1.vx = -canvas.width/(secondsPerBeat);}
            if (ball_6.dir == 0){
                    ball_6.vx = canvas.width/(secondsPerBeat);}
                else{
                    ball_6.vx = -canvas.width/(secondsPerBeat);}

            ball_1.x += ball_1.vx  * (0.0172);
            ball_6.x += ball_6.vx  * (0.0172);
        }
    }

raf = window.requestAnimationFrame(animate);

currentLastNote_temp = currentLastNote;
afterTime = audioContext.currentTime;
}



function reset(){
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    audioContext = new AudioContext();
}

function reset_canvas(){
    ball_1.x = 0;ball_1.vx = 0;ball_1.dir = 0;
    ball_2.x = canvas.width / 8; ball_2.vx = 0; ball_2.dir = 1;
    ball_3.x = canvas.width / 8 * 2; ball_3.vx = 0; ball_3.dir = 1;
    ball_4.x = canvas.width / 8 * 3; ball_4.vx = 0; ball_4.dir = 1;
    ball_5.x = canvas.width / 6; ball_5.vx = 0; ball_5.dir = 1;
    ball_6.x = canvas.width / 6 * 2; ball_6.vx = 0; ball_6.dir = 1;
}

window.AudioContext = window.AudioContext || window.webkitAudioContext;
audioContext = new AudioContext();



function nextNote() {
    // Advance current note and time by a 16th note...
     if (count > 5)
        tempo = Math.round(bpmAvg * 100) / 100;


     secondsPerBeat = 60.0 / tempo;  // Notice this picks up the CURRENT 
     
    if (tempoBase == 0)                                   // tempo value to calculate beat length.
        nextNoteTime += 0.25 * secondsPerBeat;  // Add beat length to last beat time
    else
        nextNoteTime += 1/3 * secondsPerBeat;

    currentLastNote++;  // Advance the beat number, wrap to zero

    if (tempoBase == 0){
        if (currentLastNote == 16){
            currentLastNote = 0;
        }
    }
    else{
        if (currentLastNote ==12){
            currentLastNote = 0;
        }
    }
}

function scheduleNote( beatNumber, time ) {
    // push the note on the queue, even if we're not playing.
    notesInQueue.push( { note: beatNumber, time: time } );

    if ( (noteResolution==1) && (beatNumber%2))
        return; // we're not playing non-8th 16th notes
    if ( (noteResolution==2) && (beatNumber%4))
        return; // we're not playing non-quarter 8th notes
    if ( (noteResolution==4) && (beatNumber%3==1))
        return;

    // create an oscillator
    //console.log(beatNumber)
    var osc = audioContext.createOscillator();
    osc.connect( audioContext.destination );

    if (tempoBase == 0){
        if (! (beatNumber % 16) )   // beat 0 == low pitch
            osc.frequency.value = 880.0;
        else if (beatNumber % 4)    // quarter notes = medium pitch
            osc.frequency.value = 220.0;
        else                        // other 16th notes = high pitch
            osc.frequency.value = 440.0;
    }
    else{
        if (! (beatNumber % 12) )
            osc.frequency.value = 880.0;
        else if (beatNumber % 3)
            osc.frequency.value = 220.0;
        else
            osc.frequency.value = 440.0;
    }

    osc.start( time );
    osc.stop( time + noteLength );
}

function scheduler() {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime ) {
        scheduleNote( currentLastNote, nextNoteTime );
        nextNote();


    }
    timerID = window.setTimeout( scheduler, lookahead );
}

function playToStart() {
    isPlaying = !isPlaying;
    var image = document.getElementById('myImage');

    if (isPlaying) { // start playing
        currentLastNote = 0;
        nextNoteTime = audioContext.currentTime;
        scheduler();    // kick off scheduling
        image.src = "Final_proj/stop.png";
        window.requestAnimationFrame(animate);

        afterTime = audioContext.currentTime;
    } else {
        window.clearTimeout( timerID );
        image.src = "Final_proj/start.png";
        window.cancelAnimationFrame(raf);
        audioContext.close();
        reset();
    }
}

function changeImage(){
    var image = document.getElementById('myImage2');
    if(isPlaying){
    if(noteResolution == 0){
        image.src = 'Final_proj/8th.png';
        noteResolution = 1;
        tempoBase = 0;

        window.clearTimeout( timerID );
        window.cancelAnimationFrame(raf);
        audioContext.close();
        reset();
        currentLastNote = 0;
        nextNoteTime = audioContext.currentTime;
        scheduler();    // kick off scheduling
        window.requestAnimationFrame(animate);

   

    }
    else if(noteResolution == 1){
        image.src = 'Final_proj/4th.png';
        noteResolution = 2;
        tempoBase = 0;

        window.clearTimeout( timerID );
        window.cancelAnimationFrame(raf);
        audioContext.close();
        reset();
        currentLastNote = 0;
        nextNoteTime = audioContext.currentTime;
        scheduler();    // kick off scheduling
        window.requestAnimationFrame(animate);

    }
    else if(noteResolution == 2){
        image.src = 'Final_proj/triplet.png';
        noteResolution = 3;
        tempoBase = 1;

        window.clearTimeout( timerID );
        window.cancelAnimationFrame(raf);
        audioContext.close();
        reset();
        currentLastNote = 0;
        nextNoteTime = audioContext.currentTime;
        scheduler();    // kick off scheduling
        window.requestAnimationFrame(animate);
    }
    else if(noteResolution == 3){
        image.src = 'Final_proj/swing.png';
        noteResolution = 4;
        tempoBase = 1;

        window.clearTimeout( timerID );
        window.cancelAnimationFrame(raf);
        audioContext.close();
        reset();
        currentLastNote = 0;
        nextNoteTime = audioContext.currentTime;
        scheduler();    // kick off scheduling
        window.requestAnimationFrame(animate);
    }
    else{
        image.src = 'Final_proj/16th.png';
        noteResolution = 0;
        tempoBase = 0;

        window.clearTimeout( timerID );
        window.cancelAnimationFrame(raf);
        audioContext.close();
        reset();
        currentLastNote = 0;
        nextNoteTime = audioContext.currentTime;
        scheduler();    // kick off scheduling
        window.requestAnimationFrame(animate);
    }
}
}

////////////////////////////BPM counting Part/////////////////////////

var count = 0;
var msecsFirst = 0;
var msecsPrevious = 0;

function ResetCount()
  {
  count = 0;
  document.TAP_DISPLAY.T_AVG.value = "";
  document.TAP_DISPLAY.T_TAP.value = "";
  document.TAP_DISPLAY.T_RESET.blur();
  }

function TapForBPM(e)
  {
  document.TAP_DISPLAY.T_WAIT.blur();
  timeSeconds = new Date;
  msecs = timeSeconds.getTime();
  if ((msecs - msecsPrevious) > 1000 * document.TAP_DISPLAY.T_WAIT.value)
    {
    count = 0;
    }

  if (count == 0)
    {
    document.TAP_DISPLAY.T_AVG.value = "First Beat";
    document.TAP_DISPLAY.T_TAP.value = "First Beat";
    msecsFirst = msecs;
    count = 1;
    }
  else
    {
    bpmAvg = 60000 * count / (msecs - msecsFirst);
    document.TAP_DISPLAY.T_AVG.value = Math.round(bpmAvg * 100) / 100;
    document.TAP_DISPLAY.T_WHOLE.value = Math.round(bpmAvg);
    count++;
    document.TAP_DISPLAY.T_TAP.value = count;
    }
  msecsPrevious = msecs;
  return true;
  }
document.onkeypress = TapForBPM;

