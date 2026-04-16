// Slot: espacio desde el que se renderiza la pantalla activa

import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { View } from "react-native";
import { Colors } from "@/constants/theme";

// Layout raíz de la app, va a envolver todas las rutas dentro de app/

const RootLayout = () => {
    return (
        <View style={{ backgroundColor: Colors.background, flex: 1 }}>
            <Slot />
            <StatusBar style="light" />
        </View>
    );
};

export default RootLayout;