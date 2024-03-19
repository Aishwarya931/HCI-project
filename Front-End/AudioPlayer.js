import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';

const AudioPlayer = ({ audioUri }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSound = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          {},
          onPlaybackStatusUpdate,
          true
        );
        setSound(sound);
        sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      } catch (error) {
        console.error('Error loading audio:', error);
        setError('Error loading audio');
      }

      setIsLoading(false);
    };

    loadSound();

    return () => {
      if (sound?.isLoaded) {
        sound.unloadAsync();
      }
    };
  }, [audioUri]);

  const onPlaybackStatusUpdate = (status) => {
    setPosition(status.positionMillis);
    setDuration(status.durationMillis);

    if (status.error) {
      console.error('Playback error:', status.error);
      setError('Playback error');
    }

    if (status.didJustFinish) {
      setIsPlaying(false); // Pause the playback
      setPosition(0); // Reset the position to 0
    }
  };

  const handlePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60000);
    const seconds = ((time % 60000) / 1000).toFixed(0);
    return `${minutes}:${(seconds < 10 ? '0' : '')}${seconds}`;
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <Text>Loading audio...</Text>
      ) : error ? (
        <Text>{error}</Text>
      ) : (
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.button} onPress={handlePlayPause}>
            <MaterialIcons
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={24}
              color="black"
            />
          </TouchableOpacity>
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{formatTime(position)}</Text>
            <Text style={styles.timeSeparator}>/</Text>
            <Text style={styles.time}>{formatTime(duration)}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    padding: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  time: {
    fontSize: 16,
  },
  timeSeparator: {
    marginHorizontal: 5,
    fontSize: 16,
  },
});

export default AudioPlayer;
