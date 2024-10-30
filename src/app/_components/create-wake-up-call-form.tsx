"use client"

import { useFormStatus } from "react-dom"
import { useActionState } from "react"
import { createWakeUpCallAction } from "~/server/actions"

export default function CreateWakeUpCallForm() {
  const { pending } = useFormStatus()
  const [state, submitAction] = useActionState(createWakeUpCallAction, {
    message: "",
    fields: {},
    errors: [],
  })

  return (
    <form action={submitAction} className="flex flex-col gap-2 text-black">
    <label htmlFor="phoneNumber" className="text-sm font-medium text-gray-200">Phone Number</label>
      <input type="text" name="phoneNumber" />
      <label htmlFor="message" className="text-sm font-medium text-gray-200">Message</label>
      <input type="text" name="message" />
      <label htmlFor="scheduledAt" className="text-sm font-medium text-gray-200">Scheduled At</label>
      <input type="datetime-local" name="scheduledAt" />
      <label htmlFor="isRecurring" className="text-sm font-medium text-gray-200">Recurring</label>
      <input type="checkbox" name="isRecurring" />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded-md">Create</button>
    </form>
  )
}
