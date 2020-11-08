import React, { useState } from 'react'

import "./modal.styles.css"

export default function Modal({ modalRef, setPeerConnection, configuration, setCon2, setRoomId, roomIdData }) {

    const [create, setCreate] = useState({
        roomId: ""
    });

    const handleCancelPlaylist = () => {
        modalRef.current.classList.remove("modal-active-state");
    }

    const handleChange = (e) => {
        const {name, value} = e.target;

        setCreate({...create, [name]: value});
    }

    const {roomId} = create;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const {roomId} = create;
        if(roomIdData.map(data => data.roomId === roomId && data.answer)[0] && roomIdData.map(data => data.roomId === roomId && data.answer)[0].type){
            alert("Please, enter different Room ID. This already exists.")
        }
        setRoomId(roomId.trim())
        setPeerConnection(new RTCPeerConnection(configuration));
        setCon2(true);

        setCreate({
            roomId: ""
        })

        modalRef.current.classList.remove("modal-active-state");
    }



    return (
        <div ref={modalRef} className="modal-top-container">
            <div>
                <div className="modal-background"></div>
                <div className="modal-description">
                    <div className="text-center mb-4">
                        <h2>Enter the Room Id</h2>
                    </div>
                    <form onSubmit={handleSubmit} >
                        <div className="form-group">
                            <input onChange={handleChange} name="roomId" value={roomId} type="text" className="form-control" placeholder="Room Id" required/>
                        </div>

                        <div className="buttons">
                            <button onClick={handleCancelPlaylist} type="button" className="btn btn-danger">Cancel</button>
                            <button type="submit" className="btn btn-success">Join</button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}