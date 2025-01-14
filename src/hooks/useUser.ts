import { useCallback, useContext, useState } from "react"
import UserContext from "../contexts/userContext"
import { User } from "../types/server/class/User"
import { useNavigate } from "react-router-dom"

export const useUser = () => {
    const userContext = useContext(UserContext)
    const navigate = useNavigate()
    const { user, setUser, setTimestamp } = userContext


    const firstname = user?.name.split(" ")[0] || ""

    const onLogin = (user: User) => {
        setUser(user)
        navigate("/")
    }

    const logout = () => {
        setUser(null)
        navigate("/")
    }

    return {
        user,
        firstname,
        onLogin,
        logout,
        setTimestamp,
    }
}
