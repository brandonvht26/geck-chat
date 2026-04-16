import React from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, StyleSheet } from 'react-native';

const App = () => {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>¡Hola, Geckos!</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(36, 235, 142, 0.82)'
    },
    title: {
        fontSize: 50,
        color: "#c91569",
        fontWeight: 'bold'
    }
});

export default App;