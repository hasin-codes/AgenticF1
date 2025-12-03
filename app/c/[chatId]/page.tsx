"use client"

import { MainLayout } from "@/components/main-layout"
import { useParams } from "next/navigation"

export default function ChatPage() {
    const params = useParams()
    const chatId = params.chatId as string

    return <MainLayout initialChatId={chatId} />
}
