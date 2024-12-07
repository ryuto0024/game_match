interface Characters {
    game: string;
    label: string;
    characters: string[];
    rank: Rank[];
}

interface Rank {
    label: string;
    value: number;
}

export const characters: Characters[] = [
    {
        game: "StreetFighter6",
        label: "StreetFighter6",
        characters: [
            "LUKE", 
            "JAMIE",
             "MANON",
             "KIMBERLY",
             "MARISA",
             "LILY",
             "JP",
             "JURI",
             "DEE JAY",
             "CAMMIY",
             "RYU",
             "E.HONDA",
             "BLANKA",
             "GUILE",
             "KEN",
             "CHUN-LI",
             "ZANGIEF",
             "DHALSIM",
             "RASHID",
             "A.K.I.",
             "ED",
             "GOUKI",
             "VEGA",
             "TERRY",
        ],
        rank: [
            { label: "ROOKIE", value: 1 },
            { label: "BRONZE1", value: 2 },
            { label: "BRONZE2", value: 3 },
            { label: "BRONZE3", value: 4 },
            { label: "BRONZE4", value: 5 },
            { label: "BRONZE5", value: 6 },
        ]
    },
    {
        game: "smash",
        label: "bros",
        characters: ["Mario", "Koopa"],
        rank:[
            {label:"戦闘力1,000,000",value: 1},
            {label:"戦闘力2,000,000",value: 2}
        ]
    },
];