import React, { useEffect, useRef } from 'react';
import { User } from '../types';


type VideoStreamProps = {
  stream: MediaStream;
  user: User;
  loaded: boolean;
}

const VideoStream = (props: VideoStreamProps) => {
  let videoRef = useRef<HTMLVideoElement>();
  const { stream, user, loaded} = props;
  useEffect(() => { 
    if (loaded) videoRef.current.srcObject = stream 
  });

  return (
    <div className="p-4 sm:w-full md:w-1/2 lg:max-w-lg select-none">
      <div className="relative pb-3/4">
        <div className="absolute h-full w-full rounded-lg shadow-md object-cover border-4 border-gray-800 bg-gray-800 flex justify-center items-center">
          { loaded && <video ref={videoRef} autoPlay></video>}
          { !loaded && <div className="lds-ripple"><div></div><div></div></div>}
        </div>
      </div>
      <div className="relative px-4 -mt-16 ">
        <div className={`bg-white p-6 rounded-lg shadow-lg flex ${ loaded ? 'border-4 border-green-400' : ''}`}>
          <div className="flex-grow">
            <div className="flex items-baseline">
              <div className="text-gray-600 text-xs uppercase font-semibold tracking-wide">
                Ping 24ms
              </div>
            </div>
            <h4 className="mt-2 font-semibold text-lg leading-tight truncate">
              {loaded ? user.id : <span>Connecting...</span>}
            </h4>
          </div>
          <div className="flex flex-col ml-2">
            <div className="ml-2 px-2 py-1 rounded-full bg-green-200 text-indigo-800 hover:bg-indigo-300 cursor-pointer">
              
            </div>
          </div>
        </div>
      </div>
    </div>

  )
  
}


export default VideoStream;