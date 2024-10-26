window.onload = () => {
  // const warningEl = document.getElementById('warning');
  const videoElement = document.getElementById("videoElement");
  const captureBtn = document.getElementById("captureBtn");
  // const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById("stopBtn");
  const download = document.getElementById("download");
  // const audioToggle = document.getElementById('audioToggle');
  // const micAudioToggle = document.getElementById('micAudioToggle');

  // if('getDisplayMedia' in navigator.mediaDevices) warningEl.style.display = 'none';

  let blobs;
  let blob;
  let rec;
  let stream;
  let voiceStream;
  let desktopStream;

  const mergeAudioStreams = (desktopStream, voiceStream) => {
    const context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    let hasDesktop = false;
    let hasVoice = false;
    if (desktopStream && desktopStream.getAudioTracks().length > 0) {
      // If you don't want to share Audio from the desktop it should still work with just the voice.
      const source1 = context.createMediaStreamSource(desktopStream);
      const desktopGain = context.createGain();
      desktopGain.gain.value = 0.7;
      source1.connect(desktopGain).connect(destination);
      hasDesktop = true;
    }

    if (voiceStream && voiceStream.getAudioTracks().length > 0) {
      const source2 = context.createMediaStreamSource(voiceStream);
      const voiceGain = context.createGain();
      voiceGain.gain.value = 0.7;
      source2.connect(voiceGain).connect(destination);
      hasVoice = true;
    }

    return hasDesktop || hasVoice ? destination.stream.getAudioTracks() : [];
  };

  captureBtn.onclick = async () => {
    download.style.display = "none";
    const audio = true;
    const mic = true;

    desktopStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: audio,
    });

    if (mic === true) {
      voiceStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: mic,
      });
    }

    const tracks = [
      ...desktopStream.getVideoTracks(),
      ...mergeAudioStreams(desktopStream, voiceStream),
    ];

    console.log("Tracks to add to stream", tracks);
    stream = new MediaStream(tracks);
    console.log("Stream", stream);
    videoElement.srcObject = stream;
    videoElement.muted = true;

    blobs = [];

    rec = new MediaRecorder(stream, {
      mimeType: "video/mp4",
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 2000000  
    });
    rec.ondataavailable = (e) => blobs.push(e.data);
    rec.onstop = async () => {
      if (stopBtn.disabled == false) {
        stopBtn.disabled = true;
        stopBtn.click();
      }

      //blobs.push(MediaRecorder.requestData());
      blob = new Blob(blobs,  { type: 'video/mp4' });
      let url = window.URL.createObjectURL(blob);
      download.href = url;
      time = new Date().toLocaleTimeString();
      download.download = `screen_${time}.mp4`;
      download.style.display = "block";

      // const blob = new Blob(blobs, { type: 'video/webm' });
      const formData = new FormData();
      formData.append(
        "video",
        blob,
        `screen_${new Date().toLocaleTimeString()}.mp4`
      );

      // Send the file to the Node.js server
      await fetch("http://localhost:5500/upload", {
        method: "POST",
        body: formData,
      });
      // Stop the streams
      if (stream) {
        stream.getTracks().forEach((s) => s.stop());
      }
      if (desktopStream) {
        desktopStream.getTracks().forEach((s) => s.stop());
      }
      if (voiceStream) {
        voiceStream.getTracks().forEach((s) => s.stop());
      }

      videoElement.srcObject = null;
      stream = null;

      // recordedChunks = [];
    };
    captureBtn.disabled = true;
    stopBtn.disabled = false;
    rec.start();
    desktopStream.getTracks().forEach((track) => {
      track.onended = () => {
        console.log("Screen sharing stopped by user.");
        // Call your function or perform tasks here
        stopBtn.click();
      };
    });
  };

  stopBtn.onclick = () => {
    captureBtn.disabled = false;
    stopBtn.disabled = true;

    rec.stop();
    // mediaRecorder.stop();

    // if (stream) {
    //   stream.getTracks().forEach((s) => s.stop());
    // }
    // videoElement.srcObject = null;
    // stream = null;
  };
};
