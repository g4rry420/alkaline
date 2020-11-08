import React from 'react'

import "./video.styles.css"

export default function Video({ videoRef }) {
    return (
        <video ref={videoRef} className="m-3 video"  autoPlay playsInline controls></video>
    )
}
