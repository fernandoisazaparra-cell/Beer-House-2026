
import React from "react";

import {
    GiBrandyBottle,
    GiSquareBottle,
    GiGlassShot,
    GiWineBottle,
    GiEarthAmerica,
    GiWineGlass,
    GiMartini,
    GiBeerStein,
    GiBeerBottle,
    GiIceCubes
} from "@/ui/icons";

export interface Category {
    id: string;
    label: string;
    icon: React.ElementType;
    to: string;
}

export const defaultCategories: Category[] = [
    { id: "whisky", label: "Whisky", icon: GiIceCubes, to: "/categoria/whisky" },
    { id: "ron", label: "Ron", icon: GiBrandyBottle, to: "/categoria/ron" },
    { id: "vodka", label: "Vodka", icon: GiBeerBottle, to: "/categoria/vodka" },
    { id: "tequila", label: "Tequila", icon: GiGlassShot, to: "/categoria/tequila" },
    { id: "vino", label: "Vino", icon: GiWineGlass, to: "/categoria/vino" },
    { id: "champana", label: "Champaña", icon: GiSquareBottle, to: "/categoria/champana" },
    { id: "cerveza", label: "Cerveza", icon: GiBeerStein, to: "/categoria/cerveza" },
    { id: "cocteles", label: "Cócteles", icon: GiMartini, to: "/categoria/cocteles" },
    { id: "nacionales", label: "Nacionales", icon: GiWineBottle, to: "/categoria/nacionales" },
    { id: "importados", label: "Importados", icon: GiEarthAmerica, to: "/categoria/importados" },
];