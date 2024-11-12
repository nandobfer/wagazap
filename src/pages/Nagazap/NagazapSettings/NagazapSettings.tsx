import React, { Dispatch, SetStateAction } from "react"
import { Box, IconButton, useMediaQuery } from "@mui/material"
import { Nagazap } from "../../../types/server/class/Nagazap"
import { Subroute } from "../Subroute"
import { Token } from "./Token"
import { DeleteNagazap } from "./DeleteNagazap"
import { ArrowBack, Refresh } from "@mui/icons-material"

interface NagazapSettingsProps {
    nagazap: Nagazap
    setNagazap: React.Dispatch<React.SetStateAction<Nagazap | undefined>>
    fetchNagazaps: () => Promise<void>
    setShowInformations: Dispatch<SetStateAction<boolean>>
}

export const NagazapSettings: React.FC<NagazapSettingsProps> = ({ nagazap, setNagazap, fetchNagazaps, setShowInformations }) => {
    const isMobile = useMediaQuery("(orientation: portrait)")
    return (
        <Subroute
            title="Configurações"
            left={
                isMobile ? (
                    <IconButton
                        onClick={() => {
                            setShowInformations(false)
                        }}
                    >
                        <ArrowBack />
                    </IconButton>
                ) : undefined
            }
        >
            <Box sx={{ flexDirection: "column", gap: "1vw" }}>
                <Token nagazap={nagazap} />
                <DeleteNagazap nagazap={nagazap} setNagazap={setNagazap} fetchNagazaps={fetchNagazaps} />
            </Box>
        </Subroute>
    )
}
