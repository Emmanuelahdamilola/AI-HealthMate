'use client'

import { Button } from '@/components/ui/button'
import { IconArrowRight } from '@tabler/icons-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'

export type AiDoctorAgent = {
  id: number,
  name: string,
  specialty: string,
  description: string,
  image: string,
  agentPrompt: string,
  doctorVoiceId?: string
}

type Props = {
  AiDoctorAgent: AiDoctorAgent
}

export default function AiDoctorAgentCard({ AiDoctorAgent }: Props) {
  const router = useRouter()

  const handleStartConsultation = async () => {
    try {
      const res = await axios.post('/api/chat-session', {
        notes: 'New consultation',
        selectedDoctor: AiDoctorAgent,
        note: 'New consultation',
        report: {},
        status: 'pending',
        createdOn: new Date().toISOString(),
      })

      router.push(`/dashboard/medical-voice/${res.data.sessionId}`)
    } catch (err) {
      console.error('Failed to start consultation:', err)
      alert('Unable to start consultation. Try again.')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-xs flex flex-col bg-[#111827] rounded-2xl shadow-lg overflow-hidden border border-cyan-500/20"
    >
      {/* Image */}
      <div className="relative w-full h-48 flex-shrink-0">
        <Image
          src={AiDoctorAgent.image}
          alt={AiDoctorAgent.name}
          fill
          className="object-contain bg-black"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 text-white">
        <h3 className="text-lg font-bold">{AiDoctorAgent.name}</h3>
        <span className="text-xs bg-gradient-to-r from-cyan-400 to-purple-500 px-2 py-0.5 rounded-full inline-block shadow-md">
          {AiDoctorAgent.specialty}
        </span>
        <p className="text-sm text-gray-300 line-clamp-2 mt-1">
          {AiDoctorAgent.description}
        </p>

        {/* Button */}
        <div className="mt-3 flex justify-center">
          <Button
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2"
            onClick={handleStartConsultation}
          >
            Start
            <IconArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
