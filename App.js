/* 

-------------INSTRUCTIONS----------------
Une application météo, avec les fonctionnalités suivant

Une page pévisions : 7 jours, une image, une icone, les minimales, et les maximales
Une page recherche : saisie, option géolocalisation, et liste des résultats
Une page favoris : liste des favoris


-------------TO DO LIST----------------
- fix passing params from search to index
- implemen town name searching + laoding coords? new api?
- static storage needs work 
- add to favourites button
- load existing favourites?
*/



//-----------DEPENDENCIES AND CONFIG---------------


import 'react-native-gesture-handler'; //navigation
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, Alert, ImageBackground, TouchableOpacity, Button, FlatList, ActivityIndicator, SafeAreaView, ScrollView, RefreshControl, StatusBar, PermissionsAndroid, TextInput, ViewStyle, TextStyle, TextInputProps } from 'react-native';
import * as Location from 'expo-location';

//pagination
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

//open weather key config
const openWeatherKey = `fe5274e1e1f6d5ccddc365d41c0e1a6a`; //the key to connext to the open web service
let url = `https://api.openweathermap.org/data/2.5/onecall?&units=metric&exclude=minutely&appid=${openWeatherKey}`;

//form - search bar
import { FieldError } from 'react-hook-form';

//storage
import create from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from 'react-native';

const image = { uri: "https://i.pinimg.com/originals/b8/0e/9f/b80e9fb1bc10d0c3f1aed0929152576f.png" };

//-----------TRANSITIONS---------------


const horizontalAnimation = {
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        transform: [{
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [layouts.screen.width, 0],
          }),
        }]
      }
    };
  }
};


//-----------NAVIGATION/APP---------------


const Stack = createStackNavigator();

function App({ navigation }) {
  //print page
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="index">
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


//-----------STORAGE---------------

/* Sample data structure:
        {
          id: 0,
          city: "Oloron",
          longitude: "0",
          latitude: 0
        },
*/

//storage object
const storeIt = create(
  persist(
    (set, get) => ({
      favesArr: [],
      addFave: (item) => set((state) => ({ favesArr: [state.favesArr, item] })), //think need a return in here
      delFave: (prop) => set(() => ({ favesArr: [prop] })),
    }),
    {
      name: "favourites",
      getStorage: () => AsyncStorage
    }));


//-----------COMPONENTS---------------

const faves = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('index')} >
          <Image style={styles.navIcon} source={require('./assets/cloud.png')} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('search')} >
          <Image style={styles.navIcon} source={require('./assets/search.png')} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('faves')} >
          <Image style={styles.navIcon} source={require('./assets/star.png')} />
        </TouchableOpacity>
      </View>
      <ImageBackground source={image} style={styles.image}>

      </ImageBackground>
    </SafeAreaView>
  );
}


const search = ({ navigation }) => {
  //add event listeners? i think?
  const [text, onChangeText] = React.useState("");
  var userInput = ""; //this is the value of the town they want to find

  //after the user enters the town name...
  //see if their location is in the database
  const searchForLocation = () => {
    //if input is valid, proceed
    if (userInput !== "" && /^[a-zA-Z]+$/.test(userInput)) {
      //if the input is valid, pass it back to the index
      navigation.navigate('index', { town: userInput });
      return;
    }
    //if input is invalid...
    console.log("invalid");
    Alert.alert('Location must not contain numbers or special characters.');
    return;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('index')} >
          <Image style={styles.navIcon} source={require('./assets/cloud.png')} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('search')} >
          <Image style={styles.navIcon} source={require('./assets/search.png')} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('faves')} >
          <Image style={styles.navIcon} source={require('./assets/star.png')} />
        </TouchableOpacity>
      </View>
      <View style={styles.searchBar}>
        <TextInput onChangeText={
          (text) => {
            userInput = text;
            return;
          }} defaultValue={text} style={styles.input} />
        <TouchableOpacity style={styles.button} onPress={searchForLocation} >
          <Text style={styles.buttonTxt}>Go</Text>
        </TouchableOpacity>
      </View>

      <ImageBackground source={image} style={styles.image}>

      </ImageBackground>
    </SafeAreaView>
  );
}


const index = ({ navigation }, town) => {

  //these are hooks
  //they let you use and state react features without writing a class
  //(need to read up on this, find more info here https://reactjs.org/docs/hooks-state.html)
  const [forecast, setForecast] = useState(null); //get forecast
  const [refreshing, setRefreshing] = useState(false); //refresh it

  //!!!!!!!!!!!!!!!!!!!!!!PARAMETRE PASSING NOT WORKING
  //test zone
  console.log("town = " + JSON.stringify(town));
  console.log(town)
  //end test zone!!!!!!!!!!!!!!!!!!!!!!!!

  const loadForecast = async () => {
    setRefreshing(true); //make it refresh

    //if they haven't searched for a town, just load their location
    if (JSON.stringify(town) === "{}") {
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
    }

    //if they have searched for a town, load their search (or try to)
    else {
      //code here
      console.log("parameter passed");
      setForecast("data"); //set the forecast to your data to finish it off
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
      <ImageBackground source={image} style={styles.image}>

        <View style={styles.navbar}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('index')} >
            <Image style={styles.navIcon} source={require('./assets/cloud.png')} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('search')} >
            <Image style={styles.navIcon} source={require('./assets/search.png')} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('faves')} >
            <Image style={styles.navIcon} source={require('./assets/star.png')} />
          </TouchableOpacity>
        </View>

        <ScrollView refreshControl={<RefreshControl onRefresh={() => { loadForecast() }} refreshing={refreshing} />} >
          <Text style={styles.title}>Weather</Text>

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
          <Text style={styles.subtitle}>Next 7 Days</Text>
          {forecast.daily.slice(0, 7).map(d => {
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
      </ImageBackground>

    </SafeAreaView>
  );
}


//-----------STYLE---------------
const styles = StyleSheet.create({
  title: {
    width: '100%',
    textAlign: 'center',
    fontSize: 42,
    color: '#373d4a',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  subtitle: {
    fontSize: 24,
    marginVertical: 12,
    marginLeft: 4,
    color: '#373d4a'
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    // backgroundColor: '#373d4a'
  },
  loading: {
    flex: 1,
    backgroundColor: '#373d4a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  current: {
    alignItems: 'center',
    alignContent: 'center',
    padding: 10
  },
  currentTemp: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#373d4a',
    textAlign: 'center',
  },
  currentDescription: {
    width: '100%',
    textAlign: 'center',
    fontWeight: '200',
    fontSize: 24,
    color: '#373d4a',
    backgroundColor: 'rgba(118, 182, 192, 0.5)'
  },
  hour: {
    padding: 6,
    flexDirection: 'column',
    backgroundColor: 'rgba(118, 182, 192, 0.5)',
    borderRightWidth: "2px",
    borderRightColor: "#fff"
  },
  day: {
    backgroundColor: 'rgba(118, 182, 192, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: "2px",
    borderBottomColor: "#fff"
  },
  dayDetails: {
    alignItems: 'center',
    alignContent: 'center'
  },
  dayTemp: {
    marginLeft: 12,
    alignSelf: 'center',
    fontSize: 20,
    color: '#373d4a'
  },
  largeIcon: {
    width: 200,
    height: 100,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: "15%"
  },
  smallIcon: {
    width: 100,
    height: 100,
    // borderLeftWidth: "2px",
    // borderLeftColor: "#000",
    // marginLeft: "5px"
  },
  input: {
    backgroundColor: '#fff',
    margin: 20,
    height: 30,
    padding: 5,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: 'rgba(118, 182, 192, 0.5)'
  },
  navIcon: {
    width: 50,
    height: 50,
    padding: "5px"
  },
  image: {
    flex: 1,
    //resizeMode: 'cover',
    justifyContent: "center"
  },
  button: {
    alignItems: "center"
  },
  searchBar: {
    flexDirection: 'row'
  },
  buttonTxt: {
    backgroundColor: '#373d4a',
    color: '#fff',
    margin: 20,
    height: 30,
    padding: 5,
    borderRadius: 25
  }
});


export default App;