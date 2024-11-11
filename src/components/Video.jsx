// src/App.jsx or src/App.tsx
import React, { useState , useRef} from 'react';
import ReactPlayer from 'react-player';
import { VideoToFrames,VideoToFramesMethod } from './VideoToFrame.ts';
import { FFmpeg} from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile, } from "@ffmpeg/util";
import * as helpers from '../utils/helpers.js'
import RangeInput from './RangeInput.js';

function Video() {
  const [videoURL, setVideoURL] = useState(null);
  const [inputVideoFile, setInputVideoFile] = useState(null);
  const [images, setImages] = useState([]);
  const [loading,setLoading] = useState(false) 
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const messageRef = useRef(null);
  const [showTrimVideo,setShowTrimVideo] = useState(false)
  const [rStart, setRstart] = useState(0);
  const [rEnd, setRend] = useState(10);
  const videoRef = useRef(null)
  const [thumbnailIsProcessing, setThumbnailIsProcessing] = useState(false);
  const [videoMeta, setVideoMeta] = useState(null);
  const [thumbNails,setThumbNails] = useState([])
  const [trimVideo,setTrimVideo] = useState(null)
  const ffmpegRef = useRef(new FFmpeg())


  const load = async () => {
    setLoaded(true)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd'
    const ffmpeg = ffmpegRef.current
    ffmpeg.on('log', ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message
    })
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    })
  }

  // const transcode = async () => {
  //   await load()
  //   setShowTrimVideo(false)
  //   let startTime = ((rStart/100) * videoMeta.duration).toFixed(0)
  //   let offsetTime = ((rEnd/100) * videoMeta.duration).toFixed(0)
  //   const ffmpeg = ffmpegRef.current
  //   console.log(helpers.toTimeString(startTime))
  //   console.log(helpers.toTimeString(offsetTime))
  //   // u can use 'https://ffmpegwasm.netlify.app/video/video-15s.avi' to download the video to public folder for testing
  //   await ffmpeg.writeFile('input.mp4', await fetchFile(videoURL))
  //   await ffmpeg.exec(['-i', 'input.mp4','-ss',helpers.toTimeString(startTime), '-t',helpers.toTimeString(offsetTime),'output.mp4'])

  //   const data = (await ffmpeg.readFile('output.mp4'))
  //   if (videoRef.current)
  //   setTrimVideo(URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })))
  //     setLoaded(false)
  //     setShowTrimVideo(true)

    
  // }

  const transcode = async () => {
    setTrimVideo(null)
    setLoaded(true)
    await load();
    setShowTrimVideo(false);
  
    const startTime = (rStart / 100) * videoMeta.duration;
    const duration = ((rEnd - rStart) / 100) * videoMeta.duration;
  
    const ffmpeg = ffmpegRef.current;
  
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoURL));
    await ffmpeg.exec([
      '-ss', 
      String(startTime), 
      '-i', 
      'input.mp4',
      '-t',
       String(duration), 
       "-c",
       "copy",
       'output.mp4'
    ]);
  
    const data = await ffmpeg.readFile('output.mp4');
    if (videoRef.current) {
      setTrimVideo(URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })));
    }
  
    setLoaded(false);
    setShowTrimVideo(true);
  };

  const handleVideoChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setInputVideoFile(file)
        setLoading(true)
      const videoURL = URL.createObjectURL(file);
      setVideoURL(videoURL);
      const frames = await VideoToFrames.getFrames(
        videoURL,
        15,
        VideoToFramesMethod.totalFrames
      );

      setLoading(false)
     setImages(frames);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      setLoading(true);
      setInputVideoFile(file)
      const videoURL = URL.createObjectURL(file);
      setVideoURL(videoURL);
      const frames = await VideoToFrames.getFrames(
        videoURL,
        15,
        VideoToFramesMethod.totalFrames
      );

      setLoading(false);
      setImages(frames);
    }
  };
  
  const now = new Date().toDateString();

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleLoadedData = async (e) => {
    // console.dir(ref.current);
   console.log('1')
    const el = e.target;
    const meta = {
      name: inputVideoFile.name,
      duration: el.duration,
      videoWidth: el.videoWidth,
      videoHeight: el.videoHeight
    };
    console.log({ meta });
    setVideoMeta(meta);
    const thumbNails = await VideoToFrames.getFrames(
      videoURL,
      15,
      VideoToFramesMethod.totalFrames
    );
    console.log(thumbNails)
    setThumbNails(thumbNails);
  };

  const handleUpdateRange = (func) => {
    return ({ target: { value } }) => {
      func(value);
    };
  };

  

  return (
    <>
    <div className="App min-h-screen flex flex-col items-center justify-center bg-white-low py-10 main-transition"
    onDrop={handleDrop}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    >
        {dragging && 
        <div className='min-h-screen w-screen absolute bg-purple-800  left-0 top-0 flex justify-center items-center main-transition'>
          <div className='text-white text-center lg:text-5xl md:text-4xl sm:text-2xl text-xl  font-bold mb-4'>Drop any where</div>
        </div>
        }
      {!videoURL &&  
      (
      <>
      <div className="header">
        <svg width="272" height="280" viewBox="0 0 272 280" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_415_368)">
          <path d="M191.932 66.084H191.151V196.054H191.932V66.084Z" fill="#383838"/>
          <path d="M202.36 72.2628L191.597 195.584L192.375 195.652L203.138 72.3307L202.36 72.2628Z" fill="#383838"/>
          <path d="M221.296 83.2205L191.303 195.369L192.057 195.571L222.051 83.4223L221.296 83.2205Z" fill="#383838"/>
          <path d="M211.99 77.8842L191.247 195.31L192.016 195.446L212.76 78.0201L211.99 77.8842Z" fill="#383838"/>
          <path d="M230.224 88.4099L191.302 195.382L192.036 195.649L230.958 88.6769L230.224 88.4099Z" fill="#383838"/>
          <path d="M238.827 93.3813L191.338 195.306L192.046 195.636L239.535 93.7111L238.827 93.3813Z" fill="#383838"/>
          <path d="M135.634 33.3636L135.243 34.04L247.8 99.025L248.191 98.3486L135.634 33.3636Z" fill="#383838"/>
          <path d="M147.086 27.0714L146.638 27.711L248.022 98.7665L248.47 98.1268L147.086 27.0714Z" fill="#383838"/>
          <path d="M156.824 21.6307L156.322 22.229L247.639 98.8829L248.141 98.2847L156.824 21.6307Z" fill="#383838"/>
          <path d="M166.156 16.2288L165.604 16.781L247.68 98.8566L248.232 98.3044L166.156 16.2288Z" fill="#383838"/>
          <path d="M175.15 11.158L174.552 11.66L247.721 98.8624L248.319 98.3604L175.15 11.158Z" fill="#383838"/>
          <path d="M183.808 6.2377L183.168 6.68599L247.711 98.7784L248.351 98.3301L183.808 6.2377Z" fill="#383838"/>
          <path d="M191.443 165.214L79.3181 195.296L79.5205 196.05L191.645 165.969L191.443 165.214Z" fill="#383838"/>
          <path d="M191.435 175.513L79.3081 195.32L79.444 196.089L191.57 176.282L191.435 175.513Z" fill="#383838"/>
          <path d="M191.408 185.498L79.3901 195.275L79.458 196.053L191.476 186.276L191.408 185.498Z" fill="#383838"/>
          <path d="M191.43 143.294L79.2751 195.658L79.6055 196.366L191.76 144.002L191.43 143.294Z" fill="#383838"/>
          <path d="M191.693 130.325L79.113 195.276L79.5033 195.952L192.083 131.002L191.693 130.325Z" fill="#383838"/>
          <path d="M191.234 153.944L79.1741 194.715L79.4412 195.449L191.501 154.678L191.234 153.944Z" fill="#383838"/>
          <path d="M192.291 196.492H78.978L78.802 196.192L22.321 98.361L22.496 98.061L78.978 0.227997H192.291L192.466 0.527997L248.948 98.361L248.772 98.661L192.291 196.492ZM79.679 195.277H191.59L247.545 98.361L191.59 1.443H79.679L23.724 98.361L79.679 195.277Z" fill="#383838"/>
          <path d="M23.1886 97.7446L22.7981 98.421L135.355 163.406L135.746 162.73L23.1886 97.7446Z" fill="#383838"/>
          <path d="M22.9493 98.0554L22.501 98.695L123.885 169.75L124.333 169.111L22.9493 98.0554Z" fill="#383838"/>
          <path d="M23.345 97.9127L22.843 98.511L114.165 175.14L114.667 174.541L23.345 97.9127Z" fill="#383838"/>
          <path d="M23.2964 97.9017L22.7441 98.454L104.832 180.542L105.384 179.99L23.2964 97.9017Z" fill="#383838"/>
          <path d="M23.2672 97.908L22.6689 98.41L95.8379 185.612L96.4362 185.11L23.2672 97.908Z" fill="#383838"/>
          <path d="M23.3268 97.973L22.687 98.421L87.1812 190.532L87.821 190.084L23.3268 97.973Z" fill="#383838"/>
          <path d="M79.7361 0.686996H78.9551V130.657H79.7361V0.686996Z" fill="#383838"/>
          <path d="M78.5794 0.566747L67.771 123.884L68.549 123.952L79.3574 0.634938L78.5794 0.566747Z" fill="#383838"/>
          <path d="M78.9087 0.771001L58.1912 118.17L58.9603 118.306L79.6778 0.906728L78.9087 0.771001Z" fill="#383838"/>
          <path d="M78.9145 0.644062L48.8472 112.787L49.6016 112.989L79.6689 0.846341L78.9145 0.644062Z" fill="#383838"/>
          <path d="M78.8899 0.528974L39.959 107.532L40.6931 107.799L79.624 0.796076L78.8899 0.528974Z" fill="#383838"/>
          <path d="M78.9084 0.590673L31.3711 102.493L32.0789 102.823L79.6162 0.920849L78.9084 0.590673Z" fill="#383838"/>
          <path d="M191.821 0.326681L79.678 30.394L79.8803 31.1484L192.023 1.08113L191.821 0.326681Z" fill="#383838"/>
          <path d="M191.907 0.259879L79.781 20.067L79.9169 20.8363L192.043 1.02916L191.907 0.259879Z" fill="#383838"/>
          <path d="M191.866 0.310311L79.8481 10.087L79.9161 10.865L191.934 1.08835L191.866 0.310311Z" fill="#383838"/>
          <path d="M191.721 0.000655307L79.5281 52.317L79.8581 53.0248L192.051 0.708482L191.721 0.000655307Z" fill="#383838"/>
          <path d="M191.797 0.373993L79.241 65.36L79.6315 66.0363L192.187 1.05034L191.797 0.373993Z" fill="#383838"/>
          <path d="M191.884 0.916477L79.856 41.678L80.123 42.4119L192.151 1.65041L191.884 0.916477Z" fill="#383838"/>
          <path d="M106.354 63.701L106.254 50.692L98.4402 55.203L98.5102 64.033L98.6042 75.942C99.0312 81.1908 100.118 86.3649 101.839 91.342C103.495 95.525 105.156 100.113 109.257 105.224C113.465 110.468 116.106 112.359 118.12 113.681C120.818 115.551 123.741 117.074 126.82 118.213C131.978 120.338 134.278 120.59 137.12 120.568C140.042 120.56 142.95 120.173 145.772 119.417C148.285 118.794 150.727 117.913 153.059 116.788C154.837 115.858 156.548 114.804 158.178 113.634C155.509 117.221 152.236 120.316 148.505 122.779C145.272 124.803 141.778 126.378 138.121 127.462C134.705 128.524 131.155 129.098 127.578 129.169C124.577 129.165 121.584 128.872 118.639 128.293C114.762 127.172 111.059 125.516 107.639 123.372C104.183 120.873 101.105 117.889 98.5012 114.512C96.3907 111.832 94.6386 108.889 93.2892 105.756C91.6209 102.525 90.2792 99.1348 89.2842 95.637C88.4444 93.3847 87.9691 91.0129 87.8762 88.611L87.6612 61.422L79.8472 65.934L80.0842 95.979C80.3517 99.5196 80.8315 103.041 81.5212 106.524C82.3665 110.453 83.4349 114.331 84.7212 118.139C85.9009 121.216 87.2359 124.232 88.7212 127.174C90.4786 130.672 92.543 134.008 94.8902 137.141C97.1574 139.868 99.6203 142.427 102.259 144.797C105.347 147.345 113.312 152.857 120.471 154.534C129.419 156.628 131.045 156.751 135.512 156.85C139.712 156.945 152.367 155.26 158.484 152.339C161.682 150.919 164.748 149.219 167.647 147.259C175.602 141.682 181.713 133.859 185.198 124.79C186.513 121.778 187.663 118.697 188.645 115.56C189.786 111.387 190.567 107.125 190.981 102.819C191.224 99.299 191.103 101.194 191.341 97.132L191.156 73.584L191.1 66.189L183.348 61.807L183.628 97.193C183.386 100.668 182.688 108.325 181.843 111.147C180.789 114.674 180.932 115.62 179.208 119.964C177.543 124.169 175.345 128.144 172.669 131.791C170.524 134.514 165.559 139.831 161.112 142.302C156.617 144.815 151.809 146.719 146.812 147.964C143.9 148.732 140.9 149.119 137.888 149.117C133.656 149.148 129.432 148.727 125.288 147.863C122.104 147.234 119.037 146.118 116.194 144.553C113.472 143.183 110.878 141.573 108.442 139.741L108.302 139.622C105.716 137.525 103.342 135.181 101.213 132.622C99.1394 130.163 97.3894 127.448 96.0062 124.544C95.695 124.025 95.4194 123.485 95.1812 122.928C96.3182 124.045 98.9452 126.552 100.36 127.628C102.398 129.19 104.534 130.62 106.755 131.908C109.306 133.145 111.937 134.209 114.63 135.093C116.939 135.785 119.295 136.309 121.68 136.662L121.78 136.673C123.546 136.884 125.321 137.002 127.099 137.024C129.777 137.048 132.45 136.801 135.078 136.285C137.646 135.725 140.887 134.75 143.178 134.056C145.495 133.206 147.749 132.193 149.922 131.025C152.477 129.535 154.908 127.842 157.19 125.96C159.475 123.912 164.04 119.41 166.043 115.875C166.972 114.336 167.818 112.748 168.576 111.118C169.611 108.917 170.498 106.649 171.23 104.33C171.774 102.456 172.211 100.553 172.539 98.63V98.599C173.017 95.4722 173.262 92.3141 173.272 89.151L173.009 55.839L165.259 51.365L165.289 55.244L165.359 81.229C165.351 84.5754 164.877 87.9044 163.95 91.12C162.769 96.002 158.962 103.855 153.25 107.581C151.502 108.828 149.599 109.844 147.59 110.603C144.469 111.78 141.191 112.49 137.862 112.71C133.662 112.743 130.137 111.417 126.47 109.686C123.319 108.141 120.462 106.057 118.03 103.527C116.469 101.773 115.008 99.9324 113.656 98.013C115.461 99.0884 117.32 100.068 119.228 100.947C120.333 101.378 121.466 101.731 122.62 102.002C124.926 102.661 126.414 102.649 129.934 102.757C132.441 102.808 134.944 102.515 137.371 101.886C140.063 100.983 142.607 99.686 144.919 98.038C147.527 96.0969 149.756 93.6933 151.496 90.947C152.914 88.6152 154.119 86.1602 155.096 83.612C155.825 81.3839 156.44 79.1199 156.937 76.829C157.662 73.5277 158.133 70.176 158.347 66.803L158.289 59.495L150.44 59.557L150.473 63.757C150.652 69.9558 149.598 76.1285 147.373 81.917C142.856 92.78 135.299 95.41 130.152 95.045C118.652 95.271 112.898 86.655 110.971 82.61C109.14 78.8571 107.877 74.8531 107.223 70.729C106.679 68.4239 106.388 66.0663 106.356 63.698" fill="#383838"/>
          <path d="M28.632 265.51C28.6671 267.927 28.132 270.318 27.07 272.489C26.0023 274.565 24.3333 276.27 22.281 277.382C19.7685 278.653 16.9735 279.262 14.16 279.152C9.54401 279.152 6.02135 277.903 3.59202 275.404C1.12385 272.676 -0.167107 269.083 1.54404e-05 265.408V241.46H4.68502V265.56C4.5247 268.127 5.38557 270.654 7.08002 272.589C8.71135 274.256 11.158 275.089 14.42 275.089C16.3153 275.171 18.1993 274.757 19.886 273.889C21.2545 273.114 22.3465 271.931 23.009 270.505C23.6926 268.928 24.0299 267.223 23.998 265.505V241.455H28.631L28.632 265.51ZM51.769 278.63H47.084V245.573H35.475V241.461H63.326V245.573H51.769V278.63ZM101.908 259.989C101.939 262.65 101.57 265.3 100.814 267.851C100.145 270.067 99.029 272.122 97.535 273.89C96.0896 275.605 94.2496 276.943 92.173 277.79C89.8257 278.736 87.3111 279.196 84.781 279.143C82.183 279.201 79.5994 278.741 77.181 277.79C75.118 276.919 73.2833 275.584 71.819 273.89C70.3499 272.101 69.2687 270.027 68.644 267.798C67.9233 265.241 67.5727 262.594 67.603 259.938C67.5266 256.511 68.1648 253.105 69.477 249.938C70.6434 247.189 72.6235 244.864 75.151 243.274C78.0894 241.582 81.4449 240.753 84.833 240.88C88.1207 240.768 91.3718 241.599 94.203 243.274C96.7517 244.854 98.7515 247.181 99.93 249.938C101.314 253.103 101.989 256.532 101.908 259.985M72.547 259.985C72.4837 262.732 72.9243 265.467 73.847 268.055C74.6044 270.167 76.0069 271.988 77.856 273.26C79.9321 274.54 82.3417 275.175 84.779 275.083C87.2019 275.19 89.5996 274.554 91.651 273.26C93.4997 271.988 94.9018 270.167 95.659 268.055C96.5817 265.467 97.0223 262.732 96.959 259.985C96.959 255.301 95.9874 251.64 94.044 249.001C92.1007 246.33 89.0294 244.994 84.83 244.993C82.3758 244.896 79.9482 245.531 77.855 246.816C76.0002 248.059 74.5946 249.866 73.846 251.969C72.9203 254.538 72.4795 257.256 72.546 259.986M141.172 278.624H135.705L115.82 247.759H115.612C115.647 248.384 115.68 249.078 115.712 249.841C115.779 250.605 115.831 251.438 115.868 252.341C115.903 253.208 115.936 254.11 115.968 255.047C116 255.984 116.018 256.922 116.021 257.859V278.631H111.7V241.461H117.114L136.948 272.228H137.155C137.121 271.811 137.088 271.239 137.055 270.51C137.02 269.746 136.986 268.913 136.955 268.01C136.92 267.077 136.886 266.122 136.855 265.147C136.824 264.172 136.806 263.27 136.802 262.441V241.461H141.175L141.172 278.624ZM185.254 259.989C185.285 262.65 184.917 265.3 184.161 267.851C183.492 270.067 182.376 272.122 180.881 273.89C179.436 275.605 177.596 276.943 175.52 277.79C173.172 278.736 170.657 279.196 168.126 279.143C165.528 279.201 162.944 278.741 160.526 277.79C158.463 276.918 156.629 275.584 155.164 273.89C153.695 272.101 152.614 270.027 151.988 267.798C151.268 265.241 150.918 262.594 150.948 259.938C150.872 256.511 151.51 253.105 152.822 249.938C153.989 247.189 155.969 244.864 158.497 243.274C161.435 241.582 164.791 240.753 168.179 240.88C171.467 240.768 174.718 241.599 177.549 243.274C180.098 244.854 182.097 247.181 183.275 249.938C184.659 253.103 185.334 256.532 185.253 259.985M155.892 259.985C155.828 262.732 156.269 265.467 157.192 268.055C157.949 270.167 159.351 271.988 161.2 273.26C163.276 274.54 165.686 275.175 168.123 275.083C170.547 275.193 172.946 274.559 175 273.267C176.849 271.996 178.251 270.175 179.008 268.062C179.931 265.474 180.372 262.739 180.308 259.992C180.308 255.308 179.336 251.647 177.393 249.008C175.449 246.337 172.377 245.001 168.178 245C165.723 244.903 163.295 245.538 161.202 246.823C159.348 248.066 157.942 249.873 157.194 251.976C156.268 254.545 155.827 257.263 155.894 259.993M211.453 278.631L199.219 246.042H199.01C199.081 246.737 199.133 247.622 199.167 248.698C199.234 249.773 199.285 250.952 199.322 252.237C199.356 253.486 199.373 254.77 199.373 256.089V278.631H195.053V241.461H201.977L213.43 271.915H213.638L225.3 241.46H232.172V278.63H227.539V255.777C227.539 254.562 227.556 253.365 227.591 252.184C227.625 250.969 227.677 249.842 227.746 248.801C227.813 247.725 227.865 246.822 227.903 246.093H227.695L215.3 278.63L211.453 278.631ZM267.168 278.631L262.691 267.125H247.956L243.531 278.631H238.794L253.318 241.304H257.534L272.006 278.631H267.168ZM257.12 251.716C257.016 251.437 256.843 250.934 256.6 250.206C256.357 249.478 256.114 248.732 255.87 247.968C255.662 247.168 255.488 246.56 255.349 246.145C255.176 246.84 254.986 247.552 254.777 248.28C254.603 248.973 254.412 249.615 254.205 250.205C254.031 250.796 253.875 251.299 253.737 251.715L249.519 262.959H261.284L257.12 251.716Z" fill="#383838"/>
          </g>
          <defs>
          <clipPath id="clip0_415_368">
          <rect width="272.007" height="279.15" fill="white"/>
          </clipPath>
          </defs>
        </svg>
        <h1>Trim your video to your desired duration (remember that Utonoma short videos are 60 seconds or less)</h1>
      </div>
      <div className="max-w-lg flex flex-col w-full p-36 bg-img rounded-lg border-4 border-white shadow-lg" 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}>
        <input
          type="file"
          accept="video/*,.mkv,.avi"
          onChange={handleVideoChange}
          className="my-2 hidden"
          ref={fileInputRef}  
        />

        <button className='px-5 py-4 bg-purple-700 text-white font-semibold text-lg rounded-md flex justify-center space-x-2 hover:bg-purple-900' onClick={handleButtonClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        > <span>Start from a Video</span></button>
        <div className='text-center text-slate-800 font-semibold mt-5'>Or drop a video here</div>
      </div>
      </>
      )}

      {loading === true && !videoURL && (
        <div className="h-1/4 shimmer-effect p-6 rounded-xl shadow-lg bg-white w-1/2 ">
      </div>
      )}
<div className="flex space-x-5 justify-center">
      {videoURL  &&(
          <div className="custom-player-container  flex justify-center p-6 rounded-xl shadow-lg bg-white w-1/2">
            <video src={videoURL} ref={videoRef} width={'100%'} height={'100%'} controls onLoadedMetadata={handleLoadedData}></video>
          </div>
        )}


{videoURL && <div className='custom-player-container  flex items-center p-6 rounded-xl flex-col shadow-lg bg-white w-1/2'>
{!trimVideo && loaded && <div className='w-1/2 shimmer-effect bg-gray-400'></div>}
        {trimVideo && <>
          <video src={trimVideo} className='' controls></video>
        <button
        onClick={()=>{helpers.download(trimVideo,inputVideoFile.name)}}
        className="bg-purple-700 hover:bg-purple-900 text-white py-3 px-6 mt-4 rounded flex space-x-2"
      >
        <span>Download ⬇️</span>
      </button>
      </>}
      </div>}
        </div>

{images?.length <=0 && loading === true && (
  <div className="output flex overflow-x-scroll mt-5 mx-44 space-x-3">
    <div className='w-44 rounded-md h-20 shimmer-effect bg-gray-400'></div>
    <div className='w-44 rounded-md h-20 shimmer-effect bg-gray-400'></div>
    <div className='w-44 rounded-md h-20 shimmer-effect bg-gray-400'></div>
    <div className='w-44 rounded-md h-20 shimmer-effect bg-gray-400'></div>
    <div className='w-44 rounded-md h-20 shimmer-effect bg-gray-400'></div>
    <div className='w-44 rounded-md h-20 shimmer-effect bg-gray-400'></div>
    <div className='w-44 rounded-md h-20 shimmer-effect bg-gray-400'></div>
  </div>
)}

{videoURL && <RangeInput
rEnd={rEnd}
rStart={rStart}
handleUpdaterEnd={handleUpdateRange(setRend)}
handleUpdaterStart={handleUpdateRange(setRstart)}
loading={thumbnailIsProcessing}
videoMeta={videoMeta}
thumbNails={thumbNails}
/>}

{/* <p ref={messageRef}></p> */}

{ images?.length > 0 && <button
        onClick={transcode}
        className="bg-purple-700 hover:bg-purple-900 text-white py-3 px-6 mt-10 rounded flex space-x-2"
      >
        <span>Trim Video ✂️</span>
      </button>}

    </div>
    </>
  );
}

export default Video;
