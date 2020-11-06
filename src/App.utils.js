import { firestore } from "./firebase/firebase.conf"

export const createRoomCall = async (peerConnection, localStream, setRoomId, remoteStream) => {
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream)
    })

     // Code for collecting ICE candidates below
     const roomRef = firestore.collection("rooms").doc();
     const callerCandidatesCollection = roomRef.collection("callerCandidates");

     peerConnection.addEventListener("icecandidate", event => {
       if(!event.candidate){
        //  console.log("Got Final Candidate!");
         return;
       }
      //  console.log('Got candidate: ', event.candidate);
      callerCandidatesCollection.add(event.candidate.toJSON());
     })
     // Code for collecting ICE candidates above

     // Code for creating a room below
     const offer = await peerConnection.createOffer();
     await peerConnection.setLocalDescription(offer);

     const roomWithOffer = {
       'offer': {
         type: offer.type,
         sdp: offer.sdp,
       },
       roomId: roomRef.id
     };
     await roomRef.set(roomWithOffer);
     setRoomId(roomRef.id);

     // Code for creating a room above


     peerConnection.addEventListener("track", event => {
      // console.log('Got remote track:', event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        // console.log('Add a track to the remoteStream:', track);
        remoteStream.addTrack(track);
      })
     })

      // Listening for remote session description below
      let unsubscribe = roomRef.onSnapshot(async snapshot => {
        const data = snapshot.data();
        if(!peerConnection.currentRemoteDescription && data && data.answer){
          // console.log('Got remote description: ', data.answer);
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await peerConnection.setRemoteDescription(rtcSessionDescription);
        }
      })
       // Listening for remote session description above

       // Listen for remote ICE candidates below
       let unsubscribe2 = roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added') {
            let data = change.doc.data();
            // console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
            await peerConnection.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
      // Listen for remote ICE candidates above

      return () => {
        unsubscribe();
        unsubscribe2();
      }
}

export const joinRoomCall = async (peerConnection, localStream, roomId, remoteStream) => {
    const roomRef = firestore.collection("rooms").doc(roomId);
    const roomSnapshot = await roomRef.get();

    if(roomSnapshot.exists){
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
      })

      // Code for collecting ICE candidates below
      const calleeCandidatesCollection = roomRef.collection("calleCandidates");
      peerConnection.addEventListener("icecandidate", event => {
        if(!event.candidate){
          // console.log('Got final candidate!');
          return;
        }
        // console.log('Got candidate: ', event.candidate);
        calleeCandidatesCollection.add(event.candidate.toJSON());
      })
      // Code for collecting ICE candidates above

      peerConnection.addEventListener("track", event => {
        // console.log('Got remote track:', event.streams[0]);
        event.streams[0].getTracks().forEach(track => {
          console.log(track)
          // console.log('Add a track to the remoteStream:', track);
          remoteStream.addTrack(track);
        })
      })

       // Code for creating SDP answer below
      const offer = roomSnapshot.data().offer;
      // console.log('Got offer:', offer);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
    //   console.log('Created answer:', answer);
      await peerConnection.setLocalDescription(answer);

      const roomWithAnswer = {
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
      };
      await roomRef.update(roomWithAnswer);
      // Code for creating SDP answer above

      // Listening for remote ICE candidates below
      let unsubscribe = roomRef.collection('callerCandidates').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added') {
            let data = change.doc.data();
            // console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
            await peerConnection.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
      // Listening for remote ICE candidates 
      
      return () => unsubscribe();
    }
  }