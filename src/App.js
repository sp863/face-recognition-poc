import * as faceapi from "face-api.js";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import styled from "styled-components";
import "./App.css";

function App() {
  const [currentFace, setCurrentFace] = useState(null);
  const webcamElement = useRef();
  const canvasElement = useRef();
  const MODEL_URL = "/models";

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    };
    webcamElement.current && loadModels();
    console.log("models loaded");
  }, []);

  const validateCapturedFace = async () => {
    const response = await fetch(currentFace);
    const imageBlob = await response.blob();
    const image = await faceapi.bufferToImage(imageBlob);

    const labeledFaceDescriptors = await loadLabeledImages();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const results = detections.map((detection) =>
      faceMatcher.findBestMatch(detection.descriptor)
    );

    console.log(results[0]._label); ////여기서 본인 이름이 나옴!!!!!
  };

  useEffect(() => {
    if (currentFace) {
      validateCapturedFace();
    }
  }, [currentFace]);

  const captureFace = () => {
    const capturedImage = webcamElement.current.getScreenshot();
    setCurrentFace(capturedImage);
    console.log("face captured");
  };

  const loadLabeledImages = () => {
    const labels = ["Me", "Dad", "Mom"];

    return Promise.all(
      labels.map(async (label) => {
        const descriptions = [];
        for (let i = 1; i <= 3; i++) {
          const image = await faceapi.fetchImage(
            `https://raw.githubusercontent.com/sp863/face-recognition-poc/main/public/labeled_images/${label}/${i}.jpg`
          );
          const detections = await faceapi
            .detectSingleFace(image)
            .withFaceLandmarks()
            .withFaceDescriptor();
          descriptions.push(detections.descriptor);
        }

        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      })
    );
  };

  return (
    <Container>
      <Webcam
        ref={webcamElement}
        height={480}
        width={640}
        screenshotFormat="image/png"
      />
      <button onClick={captureFace}>Capture</button>
      <CanvasContainer>
        <canvas ref={canvasElement}></canvas>
      </CanvasContainer>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const CanvasContainer = styled.div`
  position: absolute;
`;

export default App;
