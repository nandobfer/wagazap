import React, { useState } from "react"
import { Box, IconButton, Menu, MenuItem, Paper, Typography } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"

const MessageMenuButton: React.FC<{ onClick: (event: React.MouseEvent<HTMLElement>) => void }> = ({ onClick }) => {
    return (
        <IconButton
            onClick={onClick}
            sx={{
                padding: "0.2vw",
                margin: "0.2vw",
            }}
        >
            <ExpandMoreIcon />
        </IconButton>
    )
}

const MessageMenuItem: React.FC<{ onClick: () => void; option: string }> = ({ onClick, option }) => {
    return (
        <MenuItem onClick={onClick}>
            <Typography
                sx={{
                    color: "#d9d9d9",
                }}
            >
                {option}
            </Typography>
        </MenuItem>
    )
}

interface MessageMenuProps {
    from_me?: boolean
    onClose: () => void
}

export const MessageMenu: React.FC<MessageMenuProps> = ({ from_me, onClose }) => {
    const [menuIsOpen, setMenuIsOpen] = useState(false)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

    const handleToggleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
        setMenuIsOpen(!menuIsOpen)
    }

    const handleCloseMenu = () => {
        setMenuIsOpen(false)
        onClose()
    }

    return (
        <Box sx={{ position: "absolute", top: 0, right: from_me ? 0 : undefined, left: from_me ? undefined : 0 }}>
            <MessageMenuButton onClick={handleToggleMenu} />

            <Menu
                anchorEl={anchorEl}
                open={menuIsOpen}
                onClose={handleCloseMenu}
                MenuListProps={{
                    sx: {
                        bgcolor: "#5e5e5e",
                    },
                }}
            >
                {!from_me && <MessageMenuItem onClick={handleCloseMenu} option="Responder" />}
            </Menu>
        </Box>
    )
}
