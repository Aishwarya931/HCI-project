import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import * as FileSystem from 'expo-file-system';

const PitchCustomSlider = ({setYoutubeUrl,youtubeUrl, setSelectedYtb, selectedYtb, file, onThumbMove, onChange, audioUri, setAudioUri, setFile }) => {
  const [thumbPosition, setThumbPosition] = useState(110); // Initial position of the sliderThumb
  const [isDragging, setIsDragging] = useState(false); // State to track whether thumb is being dragged
  const pan = useRef(new Animated.ValueXY()).current; // Animation value for thumb movement

  useEffect(() => {
    // Call the onThumbMove callback whenever the thumb position changes
    onThumbMove(thumbPosition);
  }, [thumbPosition, onThumbMove]);

  const handlePanResponderMove = (event, gesture) => {
    // Move the thumb vertically within the sliderTrack boundaries
    const newThumbPosition = Math.min(220, Math.max(0, thumbPosition + gesture.dy));
    setThumbPosition(newThumbPosition);
    onChange(newThumbPosition); // Call the onChange function with the new pitch value
    pan.setValue({ x: 0, y: newThumbPosition });
    console.log(newThumbPosition)

  };

  const handlePanResponderStart = () => {
    setIsDragging(true); // Thumb dragging started
  };
  let result;
  if (thumbPosition >= 110) {
    // console.log(thumbPosition, "if")
    // If thumbPosition is greater than or equal to 110, subtract 110 and then divide by 110

    result = (thumbPosition - 110) / 110;
    result = Math.abs(result);
    // Ensure the result is within the range [0, 1]
    result = Math.min(result, 1);
    // Subtract the result from 1 to get the opposite value
    result = 1 - result;
  } else {
    // console.log(((110 - thumbPosition) + 110) / 110, "else")
    // If thumbPosition is less than 110, divide 110 by thumbPosition
    result = ((110 - thumbPosition) + 110) / 110;
  }
  // Take the absolute value

  // Ensure result is rounded to 2 decimal places
  result = result.toFixed(2);
  const handlePanResponderEnd = async () => {

    console.log("-------body---------")
    console.log(youtubeUrl)
    console.log(result)
    console.log("---------------")
    //youtube one

    //normal one
    setIsDragging(false); // Thumb dragging ended
    if (selectedYtb) {
      const requestData = {
        youtube_url: youtubeUrl,
        n_steps: result
      };

      fetch('http://192.168.29.63:8086/process_youtube_audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          console.log(response, "====>>>>response")
          const contentDisposition = response.headers.get('content-disposition');
          const fileNameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = fileNameRegex.exec(contentDisposition);
          let fileName = null;
          if (matches != null && matches[1]) {
            fileName = matches[1].replace(/['"]/g, '');
          }

          // Assuming you want to set some states based on the response
          console.log('API Response:', response);
          // Handle response
          // setShowYouTubeUrlInput(false);
          // setShowAdditionalButtons(true);
          // setSelectedYtb(false)
          setYoutubeUrl('')
          setSelectedYtb(false)
          saveAudioFile(response)
          return response.json(); // Assuming the response is JSON
        })
        .catch(error => {
          // Handle errors
          console.error('Error fetching:', error);
        });
    } else {

      const rate = thumbPosition / 110; // Calculate rate value
      const formData = new FormData();
      console.log(file)
      formData.append('file', {
        uri: file[0].uri,
        name: file[0].name,
        type: file[0].mimeType,
      });
      // Append other parameters if needed
      formData.append('n_steps', result);

      // Make API call
      const response = await fetch('http://192.168.29.63:8086/pitch_shift', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data', // Ensure correct content type
        },
      });
      console.log(response, "=======>/PITCH_STREACH respsonse"); // Check the response data  

      // try {
      //   // Assuming response is already received and resolved
      //   const blobData = await response.blob(); // Extract blob data from the response
      //   const audioUri = URL.createObjectURL(blobData); // Create URL from the Blob object
      //   console.log(audioUri, "the uri from response");
      // } catch (error) {
      //   console.error('Error loading audio:', error);
      //   setError('Error loading audio');
      // }


      saveAudioFile(response)
    }
  };


  async function saveFileToLocal(responseData, fileName) {
    try {
      const fileUrl = responseData.url || responseData.headers['map']['content-disposition'].match(/"([^"]+)"/)[1];
      const fileExtension = fileUrl.split('.').pop();

      const directory = FileSystem.documentDirectory + 'pitch_shifted_files/';
      const filePath = directory + fileName + '.' + fileExtension;

      // Create directory if it doesn't exist
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

      const { uri } = await FileSystem.downloadAsync(fileUrl, filePath);

      // Check if the file was successfully downloaded
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        // Construct the URI with blobId
        const uriWithBlobId = `${uri}?blobId=${fileInfo.uri.split('/').pop()}`; // Appending blobId to URI
        // return uriWithBlobId;
        console.log('File saved successfully:', uriWithBlobId);

      } else {
        console.error('Failed to save file:', uri);
        return null;
      }
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }

  const saveAudioFile = async (response) => {
    try {
      console.log(response, "===>>>> check file name ====>save audio pitch")
      // Extracting necessary information from the response
      const fileName = response._bodyBlob._data.name; // Ensure the file extension matches the actual file type
      const blobData = response._bodyBlob._data.blobId; // Extracting blob data
      const fileType = response._bodyBlob._data.type; // Ensure the file extension matches the actual file type

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

  // const saveAudioFile = async (response) => {
  //   try {
  //     // Extracting necessary information from the response
  //     const fileName = "sample.mp3"; // Ensure the file extension matches the actual file type
  //     const blob = await response.blob();
  //     console.log(blob, "blob")
  //     // Check if the folder exists, if not, create it
  //     const folderName = FileSystem.documentDirectory + 'upload'; // Use documentDirectory for writable directory
  //     const folderInfo = await FileSystem.getInfoAsync(folderName);
  //     if (!folderInfo.exists) {
  //       await FileSystem.makeDirectoryAsync(folderName);
  //     }

  //     // Convert binary blob to base64 string
  //     const base64Data = await new Promise((resolve, reject) => {
  //       const reader = new FileReader();
  //       reader.onloadend = () => {
  //         resolve(reader.result);
  //       };
  //       reader.onerror = reject;
  //       reader.readAsDataURL(blob);
  //     });

  //     // Save the file in the specified folder with the extracted name
  //     const filePath = `${folderName}/${fileName}`;
  //     await FileSystem.writeAsStringAsync(filePath, base64Data, { encoding: FileSystem.EncodingType.Base64 });
  //     handleFilePicker(filePath)
  //     console.log('File saved successfully:', filePath);
  //   } catch (error) {
  //     console.error('Error saving file:', error);
  //   }
  // };

  const handleFilePicker = async (filePath) => {
    const formData = new FormData();
    formData.append('file', {
      uri: filePath,
      name: "sample-15s.mp3",
      type: "audio/mpeg",
    });
    formData.append('rate', 2);

    // Make POST request
    const response = await fetch('http://192.168.29.63:8085/time_stretch', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data', // Ensure correct content type
      },
    });
    console.log(response, "here is the speed response"); // Check the response data        saveAudioFile(response);

    if (!response.ok) {
      throw new Error('Failed to upload audio file');
    }

    // Assuming the response contains the audio data directly
    const audioData = await response.blob();

    // Update audioUri with the audio data
    // setAudioUri(URL.createObjectURL(audioData));
    // }

  };




  // PanResponder for handling touch gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: handlePanResponderMove,
    onPanResponderStart: handlePanResponderStart,
    onPanResponderEnd: handlePanResponderEnd,
  });

  return (
    <View style={styles.container}>
      {/* Slider track */}
      <View style={styles.sliderTrack}>
        {/* Higher label */}
        <Text style={[styles.label, styles.higherLabel]}>Higher</Text>

        {/* Slider thumb */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.sliderThumb, { top: thumbPosition }]}
        ></Animated.View>

        {/* Lower label */}
        <Text style={[styles.label, styles.lowerLabel]}>Lower</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 400, // Adjust height as needed
    position: 'relative',
  },
  sliderTrack: {
    width: 80,
    height: 300,
    backgroundColor: '#D9D9D9',
    borderRadius: 50,
    position: 'relative', // Needed for positioning labels
  },
  sliderThumb: {
    width: 80,
    height: 80,
    backgroundColor: 'white',
    borderRadius: 50,
    position: 'absolute',
    left: 0,
  },
  label: {
    textAlign: 'center',
    color: 'black',
    fontSize: 20,
    fontWeight: '400',
    wordWrap: 'break-word',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  higherLabel: {
    top: 20, // Position at the top
  },
  lowerLabel: {
    bottom: 20, // Position at the bottom
  },
});

export default PitchCustomSlider;
