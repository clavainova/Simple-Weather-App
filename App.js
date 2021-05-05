/* 
REPLACE BUTTONS WITH TOUCHABLEOPACITY SO YOU CAN STYLE THEM


-------------INSTRUCTIONS----------------
Une application météo, avec les fonctionnalités suivant

Une page pévisions : 7 jours, une image, une icone, les minimales, et les maximales
Une page recherche : saisie, option géolocalisation, et liste des résultats
Une page favoris : liste des favoris



-------------TO DO LIST----------------
- this gets forecast of your *current* location. needs to search it(?)
- also code to get forecasts of other times, but unformatted (use flatlist?)
- need to add: pagination, search, custom locations, display correct information
- hesitant to introduce stack navigator because of number of parametres which would be required to pass
- work out static storage
*/



//-----------DEPENDENCIES AND CONFIG---------------
import 'react-native-gesture-handler'; //navigation
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, Button, FlatList, ActivityIndicator, SafeAreaView, ScrollView, Alert, RefreshControl, StatusBar, PermissionsAndroid, TextInput, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import * as Location from 'expo-location';

//pagination
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

//open weather key config
const openWeatherKey = `fe5274e1e1f6d5ccddc365d41c0e1a6a`; //the key to connext to the open web service
let url = `https://api.openweathermap.org/data/2.5/onecall?&units=metric&exclude=minutely&appid=${openWeatherKey}`;

//form - search bar
import { FieldError } from 'react-hook-form';

//-----------NAVIGATION---------------

const Stack = createStackNavigator();

function App({ navigation }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="index">
        <Stack.Screen name="index" component={index} />
        <Stack.Screen name="search" component={search} />
        <Stack.Screen name="faves" component={faves} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


//-----------PERMISSIONS---------------

const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Simple weather app needs to use your location",
        message:
          "We need to access your location so we can display your local weather.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK"
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("You can use my location");
    } else {
      console.log("Location permission denied");
    }
  } catch (err) {
    console.warn(err);
  }
};

/* this method doesn't work with expo
const granted = await PermissionsAndroid.request(
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  {
    'title': 'Simple weather app needs to use your location',
    'message': 'We need to access your location so we can display your local weather.'
  }
)
*/


//-----------WEATHER LOADING PAGE---------------

const faves = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
      <Button style={styles.navbuttonselected} onPress={() => navigation.navigate('index')} title="index" />
        <Button style={styles.navbutton}  title="Search" onPress={() => navigation.navigate('search')}/>
        <Button  style={styles.navbutton} onPress={()=>console.log("you are already here")}  title="Favourites"  />
      </View>
    </SafeAreaView>
  );
}


const search = ({ navigation }) => {
  //add event listeners? i think?
  const [text, onChangeText] = React.useState("");
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
      <Button style={styles.navbuttonselected} onPress={() => navigation.navigate('index')} title="index" />
        <Button style={styles.navbutton}  title="Search" onPress={()=>console.log("you are already here")}/>
        <Button  style={styles.navbutton} onPress={() => navigation.navigate('faves')} title="Favourites" />
      </View>
      <TextInput
        onChangeText={onChangeText}
        value={text}
        style={styles.input}
      />
    </SafeAreaView>
  );
}


const index = ({ navigation }) => {

  //these are hooks
  //they let you use and state react features without writing a class
  //(need to read up on this, find more info here https://reactjs.org/docs/hooks-state.html)
  const [forecast, setForecast] = useState(null); //get forecast
  const [refreshing, setRefreshing] = useState(false); //refresh it

  const loadForecast = async () => {
    setRefreshing(true); //make it refresh

    const { status } = await Location.requestPermissionsAsync(); //get user's location
    if (status !== 'granted') { //if it's not granted...
      requestLocationPermission;
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
  };

  useEffect(() => {
    if (!forecast) {
      loadForecast(); //get the forecast!!
    }
  });

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
      <View style={styles.navbar}>
      <Button style={styles.navbuttonselected} onPress={()=>console.log("you are already here")} title="index" />
        <Button style={styles.navbutton} onPress={() => navigation.navigate('search')} title="Search" />
        <Button  style={styles.navbutton} onPress={() => navigation.navigate('faves')} title="Favourites" />
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl
            onRefresh={() => { loadForecast() }}
            refreshing={refreshing}
          />}
      >
        <Text style={styles.title}>Current Weather</Text>
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
        <View>
          <Text style={styles.subtitle}>Hourly Forecast</Text>
          <FlatList horizontal
            data={forecast.hourly.slice(0, 24)}
            keyExtractor={(item, index) => index.toString()}
            renderItem={(hour) => {
              const weather = hour.item.weather[0];
              var dt = new Date(hour.item.dt * 1000);
              return <View style={styles.hour}>
                <Text>{dt.toLocaleTimeString().replace(/:\d+ /, ' ')}</Text>
                <Text>{Math.round(hour.item.temp)}°C</Text>
                <Image
                  style={styles.smallIcon}
                  source={{
                    uri: `http://openweathermap.org/img/wn/${weather.icon}@4x.png`,
                  }}
                />
                <Text>{weather.description}</Text>
              </View>
            }}
          />
        </View>

        <Text style={styles.subtitle}>Next 5 Days</Text>
        {forecast.daily.slice(0, 5).map(d => { //Only want the next 5 days
          const weather = d.weather[0];
          var dt = new Date(d.dt * 1000);
          return <View style={styles.day} key={d.dt}>
            <Text style={styles.dayTemp}>{Math.round(d.temp.max)}°C</Text>
            <Image
              style={styles.smallIcon}
              source={{
                uri: `http://openweathermap.org/img/wn/${weather.icon}@4x.png`,
              }}
            />
            <View style={styles.dayDetails}>
              <Text>{dt.toLocaleDateString()}</Text>
              <Text>{weather.description}</Text>
            </View>
          </View>
        })}
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
    textTransform: 'uppercase'
  },
  subtitle: {
    fontSize: 24,
    marginVertical: 12,
    marginLeft: 4,
    color: '#e491ff'
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    backgroundColor: '#39353b'
  },
  loading: {
    flex: 1,
    backgroundColor: '#39353b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  current: {
    alignItems: 'center',
    alignContent: 'center',
    backgroundColor: '#913f5a',
    padding: 10
  },
  currentTemp: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
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
    flexDirection: 'row',
    backgroundColor: '#fff'
  },
  day: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center'
  },
  dayDetails: {
    alignItems: 'center',
    alignContent: 'center'
  },
  dayTemp: {
    marginLeft: 12,
    alignSelf: 'center',
    fontSize: 20,
    color: '#d18ccc'
  },
  largeIcon: {
    width: 250,
    height: 100
  },
  smallIcon: {
    width: 100,
    height: 100
  },
  input:{
    backgroundColor: '#fff',
    margin: 20,
    height: 30,
    padding: 5,
    borderWidth: 1
  },
  navbar:{
    flexDirection: 'row',
    alignItems: 'center'
  },
  navbutton:{
    width:'33%',
  },
  navbuttonselected:{
    width:'33%',
    backgroundColor: '#000'
  }
});



export default App;