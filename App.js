/* 
-------------INSTRUCTIONS----------------
Une application météo, avec les fonctionnalités suivant

Une page pévisions : 7 jours, une image, une icone, les minimales, et les maximales
Une page recherche : saisie, option géolocalisation, et liste des résultats
Une page favoris : liste des favoris



-------------TO DO LIST----------------
- this gets forecast of your *current* location. needs to search it(?)
- also code to get forecasts of other times, but unformatted (use flatlist?)
- need to add: pagination, search, custom locations, display correct information
*/



//-----------DEPENDENCIES AND CONFIG---------------
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, SafeAreaView, ScrollView, Alert, RefreshControl } from 'react-native';
import * as Location from 'expo-location';

const openWeatherKey = `fe5274e1e1f6d5ccddc365d41c0e1a6a`; //the key to connext to the open web service
let url = `https://api.openweathermap.org/data/2.5/onecall?&units=metric&exclude=minutely&appid=${openWeatherKey}`;




//-----------LOAD VISUALS & FORECAST---------------

const App = () => {

  //these are hooks
  //they let you use and state react features without writing a class
  //(need to read up on this, find more info here https://reactjs.org/docs/hooks-state.html)
  const [forecast, setForecast] = useState(null); //get forecast
  const [refreshing, setRefreshing] = useState(false); //refresh it

  const loadForecast = async () => {
    setRefreshing(true); //make it refresh

    const { status } = await Location.requestPermissionsAsync(); //get user's location
    if (status !== 'granted') { //if it's not granted...
      Alert.alert('Location could not be accessed. Check permissions.');
    }

    let location = await Location.getCurrentPositionAsync({ enableHighAccuracy: true }); //wait to get location...

    const response = await fetch(`${url}&lat=${location.coords.latitude}&lon=${location.coords.longitude}`); //get longitude and latitude
    const data = await response.json(); //wait for response - it will return lat and long in json

    if (!response.ok) { //if you don't get a good response
      Alert.alert(`Error getting weather data from server: ${data.message}`);
    } else {
      setForecast(data); //set the forecast to the data you got
    }

    setRefreshing(false); //once you've got the indfo, can stop refreshing
  }

  useEffect(() => {
    if (!forecast) {
      loadForecast(); //get the forecast!!
    }
  })


  //this loads the loading screen while the async stuff operates
  if (!forecast) {
    return <SafeAreaView style={styles.loading}>
      <ActivityIndicator size="large" />
    </SafeAreaView>;
  }

  //this is the forecast data -- print it
  const current = forecast.current.weather[0];
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            onRefresh={() => { loadForecast() }}
            refreshing={refreshing}
          />}
      >
        <Text style={styles.title}>Weather Forecast App</Text>
        <View style={styles.current}>
          <Image
            style={styles.largeIcon}
            source={{
              uri: `http://openweathermap.org/img/wn/${current.icon}@4x.png`,
            }}
          />
          <Text style={styles.currentTemp}>{Math.round(forecast.current.temp)}°C</Text>
        </View>

        <Text style={styles.currentDescription}>{current.description}</Text>

      </ScrollView>
    </SafeAreaView>
  );
}



//-----------STYLE---------------
const styles = StyleSheet.create({
  title: {
    width: '100%',
    textAlign: 'center',
    fontSize: 42,
    color: '#e491ff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: "2.5vh",
  },
  subtitle: {
    fontSize: 24,
    marginVertical: 12,
    marginLeft: 4,
    color: '#e491ff',
  },
  container: {
    flex: 1,
    backgroundColor: '#39353b',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  loading: {
    flex: 1,
    backgroundColor: '#39353b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    backgroundColor: '#913f5a',
    margin: '2vh',
    borderRadius: '25px',
  },
  currentTemp: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  currentDescription: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '200',
    fontSize: 24,
    color: '#d18ccc',
    marginBottom: 24
  },
  hour: {
    padding: 6,
    alignItems: 'center',
  },
  day: {
    flexDirection: 'row',
  },
  dayDetails: {
    justifyContent: 'center',
  },
  dayTemp: {
    marginLeft: 12,
    alignSelf: 'center',
    fontSize: 20,
    color: '#d18ccc',
  },
  largeIcon: {
    width: 250,
    height: 200,
  },
  smallIcon: {
    width: 100,
    height: 100,
  }
});



export default App;