import React, { useEffect, useRef } from 'react';

type VideoStreamProps = {
  stream: MediaStream
}

const VideoStream = (props: VideoStreamProps) => {
  let videoRef = useRef<HTMLVideoElement>();
  const { stream } = props;

  useEffect(() => { videoRef.current.srcObject = stream });

  return <video ref={videoRef} autoPlay></video>
}


export default VideoStream;