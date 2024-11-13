import React from "react"
import { Box, Tooltip } from "@mui/material"
import { Nagazap } from "../../../types/server/class/Nagazap"
import { HourglassFull, WifiTethering } from "@mui/icons-material"
import Lottie from "lottie-react"
import animation from "../../../lotties/foguinho.json"

interface OvenStatusProps {
    nagazap: Nagazap
    small_icon?: boolean
}

export const OvenStatus: React.FC<OvenStatusProps> = ({ nagazap, small_icon }) => {
    return !nagazap.paused && <Lottie animationData={animation} loop={true} style={{ width: small_icon ? "1vw" : "3vw" }} />
}
