import { WEB3FORMS_ACCESS_KEY } from '../config'

async function uploadImage(file) {
  try {
    const formData = new FormData()
    formData.append('reqtype', 'fileupload')
    formData.append('fileToUpload', file)

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    })
    if (res.ok) {
      const url = await res.text()
      if (url && url.startsWith('http')) {
        return url.trim()
      }
    }
  } catch (err) {
    console.warn('Catbox upload failed, trying fallback:', err)
  }

  // Fallback host
  const fallbackData = new FormData()
  fallbackData.append('file', file)
  const res = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: fallbackData,
  })
  if (!res.ok) throw new Error('Image upload failed')
  const json = await res.json()
  const rawUrl = json?.data?.url
  if (!rawUrl) throw new Error('Image upload failed')
  return rawUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
}

export async function sendBookingSubmission({
  name,
  email,
  file,
  therapistName,
  sessionType,
  appointmentDate,
  appointmentTime,
  specialRequests,
  address,
  depositAmount,
  totalAmount,
  balanceDue,
}) {
  const imageUrl = await uploadImage(file)

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `New booking request — ${therapistName} (${sessionType || 'Session'})`,
      from_name: 'Booking System',
      name,
      email,
      therapist: therapistName,
      session_duration: sessionType,
      appointment_date: appointmentDate || 'Not specified',
      appointment_time: appointmentTime || 'Not specified',
      special_requests: specialRequests || 'None',
      deposit_required: depositAmount || 'N/A',
      total_cost: totalAmount || 'N/A',
      balance_at_meetup: balanceDue || 'N/A',
      hosting_option: address,
      proof_of_payment_url: imageUrl,
    }),
  })

  const result = await res.json()
  if (!result.success) throw new Error(result.message || 'Submission failed')
  return result
}
