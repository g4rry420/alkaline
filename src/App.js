import React, { useRef, useState, useEffect } from "react"

import './App.css';
import Modal from "./components/modal/modal.component"
import { createRoomCall, joinRoomCall } from "./App.utils"
import { firestore } from "./firebase/firebase.conf"
import Video from "./components/video/video.compoent"

function App() {

  const [configuration, setConfiguration] = useState({
    iceServers: [{
      urls: ['stun:alkaline.vercel.app:443', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },],
    iceCandidatePoolSize: 10,
  })

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [roomIdData, setRoomIdData] = useState([]);
  const [con, setCon] = useState(false);
  const [con2, setCon2] = useState(false);
  const [screenShare, setScreenShare] = useState(false);


  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const roomIdRef = useRef();
  const openBtnRef = useRef();
  const createBtnRef = useRef();
  const joinBtnRef = useRef();
  const hangBtnRef = useRef();
  const modalRef = useRef();
  const screenShareRef = useRef();

  const localShareRef = useRef([])

  const copyRoomIdRef = useRef();
  copyRoomIdRef.current = new Array(localShareRef.length)


  useEffect(() => {
    if(!peerConnection) return;
    // registerPeerConnectionListeners();
      if(con){
        createRoomCall(peerConnection, localStream, setRoomId, remoteStream, localShareRef)
      }
      
      if(con2){
        joinRoomCall(peerConnection, localStream, roomId, remoteStream, localShareRef)
      }
       // Listen for remote ICE candidates above
  }, [peerConnection, con, con2])


  useEffect(() => {
    createBtnRef.current.disabled = true;
    joinBtnRef.current.disabled = true;
    hangBtnRef.current.disabled = true;
    screenShareRef.current.disabled = true;
    const unsubscribe = firestore.collection("rooms").onSnapshot(async querySnapshot => {
      let docArray = [];
      querySnapshot.forEach(doc => {
        docArray.push({ ...doc.data() })
      })
      setRoomIdData(docArray);
    })
    
    return () => unsubscribe();
  }, [])

  const openUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true, setRoomId });
      localVideoRef.current.srcObject = stream;
      setLocalStream(stream);

      let remoteS = new MediaStream();
      remoteVideoRef.current.srcObject = remoteS;
      setRemoteStream(remoteS);


      openBtnRef.current.disabled = true;
      createBtnRef.current.disabled = false;
      joinBtnRef.current.disabled = false;
      hangBtnRef.current.disabled = false;
      screenShareRef.current.disabled = false;
    } catch (error) {
      console.log(error)
    }
  }

  const hangUp = async () => {
    const tracks = localVideoRef.current.srcObject.getTracks();
    tracks.forEach(track => track.stop())

    if(remoteStream){
      remoteStream.getTracks().forEach(track => track.stop())
    }

    if(peerConnection){
      peerConnection.close();
    }

    //Delete a room on hangup below
    if(roomId){
      const roomRef = firestore.collection("rooms").doc(roomId);
      const calleeCandidates = await roomRef.collection('calleeCandidates').get();
      calleeCandidates.forEach(async candidate => {
        await candidate.ref.delete();
      });
      const callerCandidates = await roomRef.collection('callerCandidates').get();
      callerCandidates.forEach(async candidate => {
        await candidate.ref.delete();
      });
      await roomRef.delete();
    }
    //Delete a room on hangup above

    openBtnRef.current.disabled = false;
    createBtnRef.current.disabled = true;
    joinBtnRef.current.disabled = true;
    hangBtnRef.current.disabled = true;

    document.location.reload(true);
  }

  const createRoom = async () => {

    // console.log('Create PeerConnection with configuration: ', configuration);
    setPeerConnection(new RTCPeerConnection(configuration));
    setCon(true);
  }


  const joinRoom = () => {
    modalRef.current.classList.add("modal-active-state");
  }

  const shareScreen = async () => {
    let stream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
    const screenTrack = await stream.getTracks()[0];
    localShareRef.current.find(share => share.track.kind === "video").replaceTrack(screenTrack);
    screenTrack.addEventListener("ended", () => {
      localShareRef.current.find(share => share.track.kind === "video").replaceTrack(localStream.getTracks()[1]);
    })
    setScreenShare(true);
  }

  const stopShareScreen = () => {
    setScreenShare(false);
    localShareRef.current.find(share => share.track.kind === "video").replaceTrack(localStream.getTracks()[1]);
  }

  const copyRoomId = (id) => {
    let selectedRoomId = copyRoomIdRef.current.filter(item => item.id === id);
    let selection = window.getSelection();
    selection.removeAllRanges();

    let range = new Range();
    range.selectNodeContents(selectedRoomId[0]);
    selection.addRange(range);

    document.execCommand("copy");
  }

  return (
    <div className="App container-fluid">
      <Modal modalRef={modalRef} setPeerConnection={setPeerConnection} configuration={configuration} setCon2={setCon2} setRoomId={setRoomId} roomIdData={roomIdData}/>
      <div className="text-center main-heading">
        <h1 className="display-2">Welcome to the Alkaline.</h1>
        <p>Alkaline is video calling application that helps you get connected with people.</p>
      </div>

      <div className="btn-container d-flex">
        <button ref={openBtnRef} onClick={openUserMedia}  className="btn btn-open">Open Microphone and Camera</button>
        <button ref={createBtnRef} onClick={createRoom}  className="btn btn-open">Create Room</button>
        <button ref={joinBtnRef} onClick={joinRoom}  className="btn btn-open">Join Room</button>
        {
          screenShare ? <button  onClick={stopShareScreen}  className="btn btn-open">Stop Sharing Screen</button>
            :  <button ref={screenShareRef} onClick={shareScreen}  className="btn btn-open">Share Screen</button>
        }
        <button ref={hangBtnRef} onClick={hangUp}  className="btn btn-open">Hangup</button>
        
      </div>
      
      <div className="text-center">
        <table >
          <thead>
            <tr>
              <th className="p-2 display-4" colSpan={2}>Rooms Available to Join</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2">RoomId</td>
              <td className="p-2">Status</td>
            </tr>
            {
              roomIdData.length ? roomIdData.map((data, idx) => (
                <tr  key={data.roomId}>
                  <td className="p-2 table-id-data"> 
                    <span id={data.roomId}  ref={el => copyRoomIdRef.current[idx] = el}> {data.roomId} </span>
                    <img onClick={() => copyRoomId(data.roomId)} src="https://www.lastpass.com/dist/images/cdn/img-icon-copy-@3x.png" alt="copy"/>
                  </td>
                  <td className="p-2"> {data.answer ? "Not Available" : "Available"} </td>
                </tr>
              )) : (
                <tr>
                  <td className="p-2" colSpan={2}> Not any room is created before, Create New One </td>
                </tr>
              )
            }
          </tbody>
        </table>
        <span ref={roomIdRef}></span>
      </div>

      <div className="video-container d-flex justify-content-around">
        <Video videoRef={localVideoRef} />
        <video ref={remoteVideoRef} className="remote-video m-3" autoPlay playsInline controls></video>
      </div>
    </div>
  );
}

export default App;