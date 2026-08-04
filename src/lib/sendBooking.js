import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, WEB3FORMS_ACCESS_KEY } from '../config'

async function uploadScreenshot(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Screenshot upload failed')

  const data = await res.json()
  return data.secure_url
}

export async function sendBookingSubmission({ name, email, file, therapistName }) {
  const screenshotUrl = await uploadScreenshot(file)

  const res = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `New booking — ${therapistName}`,
      name,
      email,
      therapist: therapistName,
      screenshot_url: screenshotUrl,
    }),
  })

  const result = await res.json()
  if (!result.success) throw new Error(result.message || 'Submission failed')
  return result
}
