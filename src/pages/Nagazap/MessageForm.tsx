import React, { useCallback, useEffect, useRef, useState } from "react"
import { Avatar, Box, Button, CircularProgress, Grid, IconButton, MenuItem, Paper, TextField, Typography, useMediaQuery } from "@mui/material"
import { Subroute } from "./Subroute"
import { useFormik } from "formik"
import { OvenForm } from "../../types/server/Meta/WhatsappBusiness/WhatsappForm"
import { ArrowBack, Check, CloudUpload, Error, WatchLater } from "@mui/icons-material"
import { api } from "../../api"
import { TemplateInfo } from "../../types/server/Meta/WhatsappBusiness/TemplatesInfo"
import { getPhonesfromSheet } from "../../tools/getPhonesFromSheet"
import { useSnackbar } from "burgos-snackbar"
import { Nagazap } from "../../types/server/class/Nagazap"
import { OpenInNew, Reply } from "@mui/icons-material"

import { TrianguloFudido } from "../Zap/TrianguloFudido"
import { Clear } from "@mui/icons-material"
import { SheetExample } from "./TemplateForm/SheetExample"
import AddCircleIcon from "@mui/icons-material/AddCircle"
import MaskedInputComponent from "../../components/MaskedInput"

interface MessageFormProps {
    nagazap: Nagazap
    setShowInformations: React.Dispatch<React.SetStateAction<boolean>>
}

export const MessageFormScreen: React.FC<MessageFormProps> = ({ nagazap, setShowInformations }) => {
    const icons = [
        { type: "QUICK_REPLY", icon: <Reply /> },
        { type: "URL", icon: <OpenInNew /> },
    ]

    const maxSize = "23vw"
    const inputRef = useRef<HTMLInputElement>(null)

    const { snackbar } = useSnackbar()
    const isMobile = useMediaQuery("(orientation: portrait)")

    const [templates, setTemplates] = useState<TemplateInfo[]>([])
    const [image, setImage] = useState<File>()
    const [imageError, setImageError] = useState("")
    const [loading, setLoading] = useState(false)
    const [sheetPhones, setSheetPhones] = useState<string[]>([])
    const [isImageRequired, setIsImageRequired] = useState(false)
    const [invalidNumbersError, setInvalidNumbersError] = useState(false)
    const [invalidNumbersOnSheetError, setInvalidNumbersOnSheetError] = useState(false)
    const [errorIndexes, setErrorIndexes] = useState<number[]>([])
    const [invalidSheetError, setInvalidSheetError] = useState("")

    const validatePhones = (phones: string[], sheetPhones: string[]) => {
        const invalidManualIndexes = phones.reduce<number[]>((acc, phone, index) => {
            const cleanPhone = phone.replace(/\D/g, "")
            if (cleanPhone.length !== 0 && cleanPhone.length !== 10 && cleanPhone.length !== 11) {
                acc.push(index)
            }
            return acc
        }, [])

        const invalidSheetPhones = sheetPhones.some((phone) => {
            const cleanPhone = phone.replace(/\D/g, "")
            return cleanPhone.length !== 0 && cleanPhone.length !== 10 && cleanPhone.length !== 11
        })

        setErrorIndexes(invalidManualIndexes)
        setInvalidNumbersError(invalidManualIndexes.length > 0)
        setInvalidNumbersOnSheetError(invalidSheetPhones)

        return invalidManualIndexes.length === 0 && !invalidSheetPhones
    }

    const fetchTemplates = async () => {
        try {
            const response = await api.get("/nagazap/templates", { params: { nagazap_id: nagazap.id } })
            setTemplates(response.data)
        } catch (error) {
            console.log(error)
        }
    }

    const formik = useFormik<OvenForm>({
        initialValues: { to: [""], template: null },
        async onSubmit(values) {
            if (loading) return

            if (!validatePhones(values.to, sheetPhones)) {
                snackbar({ severity: "error", text: "Existem números com formato inválido." })
                return
            }

            const valid_numbers = values.to.filter((item) => !!item.replace(/\D/g, ""))
            if (!valid_numbers.length && !sheetPhones) {
                return
            }

            const formData = new FormData()
            if (image) formData.append("file", image)

            const data: OvenForm = { ...values, to: [...valid_numbers, ...sheetPhones] }
            formData.append("data", JSON.stringify(data))

            setLoading(true)
            try {
                const response = await api.post("/nagazap/oven", formData, { params: { nagazap_id: nagazap.id } })
                console.log(response)
                snackbar({ severity: "success", text: "Mensagens colocadas no forno" })
            } catch (error) {
                console.log(error)
            } finally {
                setLoading(false)
            }
        },
    })

    const handleSheetsUpload = async (event: any) => {
        setInvalidNumbersOnSheetError(false)
        const files = Array.from(event?.target?.files as FileList)
        setInvalidSheetError("")

        files.forEach(async (file) => {
            if (file) {
                if (file.name.split(".")[1] !== "xlsx") {
                    setInvalidSheetError("Formato inválido, o arquivo de ser uma planilha do excel do tipo xlsx")
                    snackbar({ severity: "error", text: "Formato inválido, o arquivo de ser uma planilha do excel do tipo xlsx" })
                    return
                }

                try {
                    const phones = await getPhonesfromSheet(file)
                    setSheetPhones(phones.map((phone) => phone.phone.replace(/\D/g, "")))
                } catch (error) {
                    console.log(error)
                }
            }
        })
    }

    const onNewPhone = (phone = "") => {
        const to = [...formik.values.to]
        to.push(phone)
        formik.setFieldValue("to", to)
    }

    const onDeleteMessage = (index: number) => {
        const to = formik.values.to.filter((_, item_index) => item_index != index)
        formik.setFieldValue("to", to)
    }

    const handleImageChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setImageError("")
            const files = Array.from(event.target.files as FileList)
            if (files?.length > 0) {
                const file = files[0]
                if (file.size / 1024 / 1024 > 5) {
                    setImageError("Imagem muito grande, tamanho máximo de 5 MB")
                    return
                }

                if (file.type !== "image/jpeg" && file.type !== "image/png") {
                    setImageError("Tipo de arquivo não suportado. Envie uma imagem .png ou .jpeg")
                    return
                }

                setImage(file)
            }
        },
        [image]
    )

    const clearImage = () => {
        setImageError("")
        setImage(undefined)
    }

    useEffect(() => {
        fetchTemplates()
    }, [])

    useEffect(() => {
        if (formik.values.template?.components[0].format == "IMAGE") {
            setIsImageRequired(true)
        } else {
            setIsImageRequired(false)
        }
    }, [formik.values.template])

    useEffect(() => {
        console.log(formik.values.to)
    }, [formik.values.to])

    return (
        <Subroute
            title="Enviar mensagem"
            space={isMobile ? true : undefined}
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
            <form onSubmit={formik.handleSubmit}>
                <Grid container columns={isMobile ? 1 : 3} spacing={"1vw"}>
                    <Grid item xs={1}>
                        <Box sx={{ flexDirection: "column", gap: isMobile ? "2vw" : "1vw" }}>
                            <Typography sx={{ fontWeight: 600, color: "secondary.main" }}>Adicionar contatos:</Typography>
                            {!isMobile ? (
                                <Grid container columns={1}>
                                    <Grid item xs={1}>
                                        <Box sx={{ flexDirection: "column", gap: "0.2vw" }}>
                                            <Button
                                                component="label"
                                                variant="outlined"
                                                sx={{
                                                    borderStyle: invalidNumbersOnSheetError || invalidSheetError ? undefined : "dashed",
                                                    borderColor: invalidNumbersOnSheetError || invalidSheetError ? "red" : undefined,
                                                    height: "100%",
                                                    gap: isMobile ? "2vw" : "1vw",
                                                }}
                                                fullWidth
                                            >
                                                <CloudUpload />
                                                {!!sheetPhones.length ? `${sheetPhones.length} números importados` : "Importar planilha"}
                                                <input onChange={handleSheetsUpload} style={{ display: "none" }} type="file" multiple />
                                            </Button>
                                            {invalidSheetError && (
                                                <Typography color="error" fontSize="0.9rem">
                                                    {invalidSheetError}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            ) : null}
                            <Grid container columns={isMobile ? 1 : 2} spacing={isMobile ? 1 : 2}>
                                {isMobile ? (
                                    <Grid item xs={1}>
                                        <Button
                                            component="label"
                                            variant="outlined"
                                            sx={{ borderStyle: "dashed", height: "100%", gap: isMobile ? "2vw" : "1vw" }}
                                            fullWidth
                                        >
                                            <CloudUpload />
                                            {!!sheetPhones.length ? `${sheetPhones.length} números importados` : "Importar planilha"}
                                            <input onChange={handleSheetsUpload} style={{ display: "none" }} type="file" multiple />
                                        </Button>
                                    </Grid>
                                ) : null}
                                {formik.values.to.map((number, index) => (
                                    <Grid item xs={1} key={index}>
                                        <TextField
                                            label="Número"
                                            name={`to[${index}]`}
                                            value={number}
                                            onChange={formik.handleChange}
                                            InputProps={{
                                                sx: {
                                                    gap: "0.5vw",
                                                },
                                                startAdornment: (
                                                    <IconButton color="secondary" onClick={() => onDeleteMessage(index)} sx={{ padding: 0 }}>
                                                        <Clear sx={{ width: isMobile ? "5vw" : "1vw", height: isMobile ? "5vw" : "1vw" }} />
                                                    </IconButton>
                                                ),
                                                inputComponent: MaskedInputComponent,
                                                inputProps: { mask: "(00) 0 0000-0000", inputMode: "numeric" },
                                            }}
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    "& fieldset": {
                                                        borderColor: errorIndexes.includes(index) ? "red" : "inherit",
                                                    },
                                                    "&:hover fieldset": {
                                                        borderColor: errorIndexes.includes(index) ? "red" : "inherit",
                                                    },
                                                },
                                            }}
                                        />
                                    </Grid>
                                ))}
                                <Grid item xs={1}>
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            borderStyle: "dashed",
                                            height: "100%",
                                            fontSize: "0.8rem",
                                            gap: isMobile ? "2vw" : "0.5vw",
                                            paddingLeft: "0.5vw",
                                            minHeight: isMobile ? undefined : "56px",
                                        }}
                                        onClick={() => onNewPhone()}
                                        fullWidth
                                    >
                                        <AddCircleIcon fontSize="small" />
                                        Adicionar Contato
                                    </Button>
                                </Grid>
                            </Grid>
                            <Typography sx={{ color: "secondary.main" }}>Segue abaixo um modelo de como deve ser a planilha:</Typography>
                            <SheetExample />
                        </Box>
                    </Grid>
                    <Grid item xs={1}>
                        <Box
                            sx={{
                                flexDirection: "column",
                                gap: isMobile ? "2vw" : "2vw",
                            }}
                        >
                            <Box sx={{ flexDirection: "column", gap: isMobile ? "2vw" : "1vw" }}>
                                <Typography sx={{ color: "secondary.main", fontWeight: 600 }}>Selecionar templates:</Typography>
                                <TextField
                                    fullWidth
                                    label="Template"
                                    value={formik.values.template?.name || ""}
                                    onChange={(event) =>
                                        formik.setFieldValue("template", templates.find((item) => item.name == event.target.value) || null)
                                    }
                                    select
                                    SelectProps={{
                                        SelectDisplayProps: { style: { display: "flex", alignItems: "center", gap: "0.5vw" } },
                                        MenuProps: { MenuListProps: { sx: { bgcolor: "background.default" } } },
                                    }}
                                >
                                    <MenuItem value={""} sx={{ display: "none" }} />
                                    {templates.map((item) => (
                                        <MenuItem
                                            key={item.id}
                                            value={item.name}
                                            sx={{ gap: "0.5vw" }}
                                            title={item.status}
                                            disabled={item.status !== "APPROVED"}
                                        >
                                            {item.status === "PENDING" && <WatchLater color="warning" />}
                                            {item.status === "APPROVED" && <Check color="success" />}
                                            {item.status === "REJECTED" && <Error color="error" />}
                                            {item.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Typography sx={{ color: "secondary.main" }}>
                                    Por favor, selecione o template desejado para o envio da mensagem:
                                </Typography>
                            </Box>
                            {formik.values.template?.components.map((component) => {
                                if (component.format == "IMAGE") {
                                    return (
                                        <Box sx={{ flexDirection: "column", gap: isMobile ? "2vw" : "1vw" }}>
                                            <input
                                                type="file"
                                                ref={inputRef}
                                                style={{ display: "none" }}
                                                accept={"image/jpeg,image/png"}
                                                onChange={handleImageChange}
                                            />

                                            <Button
                                                variant="outlined"
                                                onClick={() => inputRef.current?.click()}
                                                sx={{ borderStyle: "dashed", gap: "1vw" }}
                                            >
                                                <CloudUpload />
                                                {"Selecionar imagem"}
                                            </Button>
                                            <Box sx={{ gap: isMobile ? "2vw" : "0.5vw" }}>
                                                <Typography
                                                    sx={{
                                                        color: imageError ? "error.main" : "secondary.main",
                                                        maxWidth: !image ? undefined : "22vw",
                                                        overflow: !image ? undefined : "hidden",
                                                        whiteSpace: !image ? undefined : "nowrap",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    {imageError ||
                                                        (image ? image.name : "Selecione uma imagem de até 5 MB para ser adicionada a mensagem")}
                                                </Typography>
                                                {image && (
                                                    <IconButton onClick={clearImage} sx={{ padding: 0 }}>
                                                        <Clear />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </Box>
                                    )
                                } else {
                                    return null
                                }
                            })}
                            <Box sx={{ flexDirection: "column", gap: "0.2vw" }}>
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={
                                        formik.values.to[0] == "" ||
                                        (!formik.values.to.length && !sheetPhones.length) ||
                                        !formik.values.template ||
                                        (isImageRequired && !image)
                                    }
                                    sx={{ marginTop: isMobile ? "2vw" : "1vw" }}
                                >
                                    {loading ? <CircularProgress size="1.5rem" color="inherit" /> : "Adicionar a fila"}
                                </Button>
                                {(invalidNumbersError || invalidNumbersOnSheetError) && (
                                    <Typography color="error">Existem números com formato inválido.</Typography>
                                )}
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={1}>
                        {formik.values.template?.components.length && (
                            <>
                                <Paper
                                    sx={{
                                        flexDirection: "column",
                                        gap: isMobile ? "2vw" : "1vw",
                                        padding: isMobile ? "4vw" : "0.5vw",
                                        position: "relative",
                                        borderRadius: "0.5vw",
                                        borderTopLeftRadius: 0,
                                        color: "secondary.main",
                                    }}
                                >
                                    <TrianguloFudido alignment="left" color="#2a323c" />
                                    {formik.values.template?.components.map((component) => {
                                        if (component.format == "IMAGE") {
                                            const imageSrc = image ? URL.createObjectURL(image) : undefined
                                            return (
                                                <Box sx={{ justifyContent: "center" }}>
                                                    <Avatar
                                                        variant="rounded"
                                                        src={imageSrc}
                                                        sx={{
                                                            width: "100%",
                                                            maxWidth: isMobile ? undefined : maxSize,
                                                            maxHeight: isMobile ? undefined : maxSize,
                                                            objectFit: "cover",
                                                            height: imageSrc == undefined ? (isMobile ? "60vw" : maxSize) : "auto",
                                                            bgcolor: "background.default",
                                                            margin: "   ",
                                                        }}
                                                    >
                                                        <CloudUpload color="primary" sx={{ width: "30%", height: "auto" }} />
                                                    </Avatar>
                                                </Box>
                                            )
                                        }
                                        if (component.text) {
                                            return (
                                                <Typography
                                                    color="#fff"
                                                    sx={{
                                                        fontWeight: component.type == "HEADER" ? "bold" : undefined,
                                                        fontSize: component.type == "FOOTER" ? "0.8rem" : undefined,
                                                        opacity: component.type == "FOOTER" ? 0.5 : 1,
                                                    }}
                                                >
                                                    {component.text}
                                                </Typography>
                                            )
                                        }
                                        if (component.buttons) {
                                            return (
                                                <Box sx={{ gap: "0.5vw", flexDirection: "column" }}>
                                                    {component.buttons?.map((button, index) => (
                                                        <Button
                                                            key={`${button.text}-${index}`}
                                                            variant="text"
                                                            fullWidth
                                                            sx={{ textTransform: "none" }}
                                                            startIcon={icons.find((item) => item.type === button.type)?.icon}
                                                            onClick={() => button.type === "URL" && window.open(button.url, "_blank")}
                                                        >
                                                            {button.text}
                                                        </Button>
                                                    ))}
                                                </Box>
                                            )
                                        }
                                        return null
                                    })}
                                </Paper>
                            </>
                        )}
                    </Grid>
                </Grid>
            </form>
        </Subroute>
    )
}
