// App.js
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Slider, Switch, Button, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PlaybackComponent from "./PlaybackComponent"
import SpeedCustomSlider from './SpeedCustomSlider'; // Import the CustomSlider component
import PitchCustomSlider from './PitchCustomSlider'; // Import the CustomSlider component
import * as FileSystem from 'expo-file-system';

export default function App() {
  const [speed, setSpeed] = useState(110); // Default speed
  const [pitch, setPitch] = useState(110); // Default pitch
  const [pairButtonColor, setPairButtonColor] = useState('#F5F5F5'); // Default button color
  const [paired, setPaired] = useState(false); // Pairing state
  const [showPlaybackComponent, setShowPlaybackComponent] = useState(true); // State to toggle visibility
  const [colorBox1, setColorBox1] = useState('rgb(255, 0, 255)'); // Default color for colorBox 1
  const [colorBox2, setColorBox2] = useState('rgb(0, 255, 255)'); // Default color for colorBox 2
  const [selectedYtb, setSelectedYtb] = useState(false); // Pairing state
  const [audioUri, setAudioUri] = useState(null);
  const [file, setFile] = useState(null);
  const [noiseCancellationButtonColor, setNoiseCancellationButtonColor] = useState('#ffffff'); // Default color for Noise Cancellation button
  const [youtubeUrl, setYoutubeUrl] = useState(youtubeUrl);

  // console.log(file,"===============> value of file =========>app.js")
  const handlePairButtonClick = async () => {
    setPaired(!paired);
    setPairButtonColor(paired ? 'transparent' : '#808080');
    if (paired) {
      // Reset pitch to speed value if unpaired
      setPitch(speed);
    }
    const formData = new FormData();
    formData.append('file', {
      uri: file[0].uri,
      name: file[0].name,
      type: file[0].mimeType,
    });
    formData.append('n_steps', 2);

    formData.append('rate', 2);

    const response = await fetch('http://192.168.29.63:8085/pair_audio', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data', // Ensure correct content type
      },
    });
    console.log(response, "=======>/PAIR AUDIO respsonse"); // Check the response data  
    saveAudioFile(response)
  };

  const handleNoiseCancellationButtonClick = async () => {
    console.log(noiseCancellationButtonColor)
    if (noiseCancellationButtonColor === '#808080') { // Check if the button color is grey

    } else {
      console.log("entered in noise cancellation");
      const formData = new FormData();
      formData.append('file', {
        uri: file[0].uri,
        name: file[0].name,
        type: file[0].mimeType,
      });
      const response = await fetch('http://192.168.29.63:8086/noise_cancellation', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data', // Ensure correct content type
        },
      });
      console.log(response, "=======>/NOISE_CANCELLATION respsonse"); // Check the response data  
      saveAudioFile(response);
    }
  };

  const saveAudioFile = async (response) => {
    try {
      // Extracting necessary information from the response
      const fileName = response._bodyBlob._data.name; // Ensure the file extension matches the actual file type
      const fileType = response._bodyBlob._data.type; // Ensure the file extension matches the actual file type

      const blobData = response._bodyBlob._data.blobId; // Extracting blob data
      // console.log(response._bodyBlob._data.blobId)
      const blob = await response.blob();

      // Check if the folder exists, if not, create it
      const folderName = FileSystem.documentDirectory + 'upload'; // Use documentDirectory for writable directory
      const folderInfo = await FileSystem.getInfoAsync(folderName);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folderName);
      }
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      // Save the file in the specified folder with the extracted name
      const filePath = `${folderName}/${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, base64Data, { encoding: FileSystem.EncodingType.Base64 });
      console.log('File saved successfully:', filePath);
      const audioFiles = [
        {
          mimeType: fileType,
          name: fileName,
          uri: filePath
        }
      ];
      // handleFilePicker(filePath)
      setFile(audioFiles)
      setAudioUri(filePath)
      // Optionally, you can return the file path or handle it in the calling function
    } catch (error) {
      console.error('Error saving file:', error);
      return null; // Return null in case of error
    }
  };
  // console.log(paired)

  const handlePlaybackButtonClick = () => {
    setShowPlaybackComponent(true); // Toggle visibility
  };

  const handleSpeedChange = (value) => {
    setSpeed(value);
    if (paired) {
      setPitch(value);
    }
  };

  const handlePitchChange = (value) => {
    setPitch(value);
    if (paired) {
      setSpeed(value);
    }
  };
  // console.log(speed,"speed")
  // console.log(pitch,"pitch")

  const handleThumbMove = (position) => {
    // Update colorBox based on thumb position
    const blue = Math.min(255, Math.max(0, 255 - (position - 50) * 2.55));
    const red = Math.min(255, Math.max(0, (position - 50) * 2.55));
    setColorBox1(`rgb(${blue}, 0, ${red})`);
  };
  const handlePitchMove = (position) => {
    // Update colorBox based on thumb position
    const blue = Math.min(255, Math.max(0, 255 - (position - 50) * 2.55));
    const red = Math.min(255, Math.max(0, (position - 50) * 2.55));
    setColorBox2(`rgb(${blue}, 0, ${red})`);
  };
  return (
    <>
      {showPlaybackComponent ? (
        <PlaybackComponent youtubeUrl={youtubeUrl} setYoutubeUrl={setYoutubeUrl} setSelectedYtb={setSelectedYtb} selectedYtb={selectedYtb} theFile={file} setFile={setFile} setAudioUri={setAudioUri} audioUri={audioUri} setShowPlaybackComponent={setShowPlaybackComponent} showPlaybackComponent={showPlaybackComponent} />
      ) : (
        <View style={styles.container}>
          {/* Controls for speed and pitch */}
          <View style={styles.textContainer}>
            <Text style={styles.sliderLabel}>Speed</Text>
            <Text style={styles.sliderLabel}>Pitch</Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderWithText}>
              <SpeedCustomSlider youtubeUrl={youtubeUrl} setYoutubeUrl={setYoutubeUrl}  setSelectedYtb={setSelectedYtb} selectedYtb={selectedYtb} setAudioUri={setAudioUri} speed={speed} handleThumbMove={handleThumbMove} setSpeed={setSpeed} onChange={handleSpeedChange} file={file} setFile={setFile} />
              <PitchCustomSlider youtubeUrl={youtubeUrl} setYoutubeUrl={setYoutubeUrl}  setSelectedYtb={setSelectedYtb} selectedYtb={selectedYtb} setAudioUri={setAudioUri} file={file} setFile={setFile} audioUri={audioUri} onChange={handlePitchChange} pitch={pitch} setPitch={setPitch} onThumbMove={handlePitchMove} />
            </View>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderWithText}>
              <View style={[styles.colorBox, { backgroundColor: colorBox1 }]}></View>
              <View style={[styles.colorBox, { backgroundColor: colorBox2 }]}></View>
            </View>
          </View>

          {/* Icon */}
          <Icon name="info" size={30} color="grey" style={styles.icon} />

          {/* Additional features and controls */}
          <View style={styles.buttonContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.buttonPair, styles.shadow, { backgroundColor: pairButtonColor }]}
                onPress={handlePairButtonClick}
              >
                <Text style={styles.buttonText}>Pair</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.buttonEffect, styles.shadow]}>
                <Text style={styles.buttonText}>Reverb</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonEffect, styles.shadow, { backgroundColor: noiseCancellationButtonColor }]}
                onPress={() => {
                  // Toggle button color
                  const newColor = noiseCancellationButtonColor === '#808080' ? '#ffffff' : '#808080';
                  setNoiseCancellationButtonColor(newColor);
                  handleNoiseCancellationButtonClick(); // Call the function to handle API request
                }}
              >
                <Text style={styles.buttonText}>Noise Cancellation</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>

              <TouchableOpacity onPress={handlePlaybackButtonClick} style={[styles.buttonLightGrey, styles.shadow]}>
                <Text style={styles.buttonText}>Playback</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.buttonLightGrey,
                  styles.shadow,
                  { backgroundColor: showPlaybackComponent ? 'transparent' : '#808080' }
                ]}
              >
                <Text style={styles.buttonText}>Modulation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 20,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: "space-around",
    alignItems: 'center',
    marginTop: 20,
  },
  sliderContainer: {
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  sliderWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  colorBox: {
    width: 100,
    height: 50,
    borderRadius: 5,
    marginBottom: 10,
    marginHorizontal: 25,
  },
  sliderLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 15,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  buttonRow: {
    flexDirection: 'row',
  },
  buttonPair: {
    flex: 1,
    padding: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ffffff', // Set border color here
  },
  buttonEffect: {
    flex: 1,
    padding: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ffffff', // Set border color here
  },
  buttonLightGrey: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffffff', // Set border color here
  },
  buttonText: {
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});