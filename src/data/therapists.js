export const sessionRates = [
  { id: '1hr', time: '1hr', amount: '$50', deposit: '$25', totalNum: 50, depositNum: 25, label: '1hr — $50 (Deposit: $25)' },
  { id: '2hrs', time: '2hrs', amount: '$100', deposit: '$50', totalNum: 100, depositNum: 50, label: '2hrs — $100 (Deposit: $50)' },
  { id: '3hrs', time: '3hrs', amount: '$150', deposit: '$75', totalNum: 150, depositNum: 75, label: '3hrs — $150 (Deposit: $75)' },
  { id: '5hrs', time: '5hrs', amount: '$300', deposit: '$150', totalNum: 300, depositNum: 150, label: '5hrs — $300 (Deposit: $150)' },
  { id: 'halfday', time: 'Half day', amount: '$200', deposit: '$100', totalNum: 200, depositNum: 100, label: 'Half day — $200 (Deposit: $100)' },
  { id: 'overnight', time: 'Overnight', amount: '$250', deposit: '$125', totalNum: 250, depositNum: 125, label: 'Overnight — $250 (Deposit: $125)' },
  { id: 'sleepover', time: 'Sleep over', amount: '$500', deposit: '$250', totalNum: 500, depositNum: 250, label: 'Sleep over — $500 (Deposit: $250)' },
  { id: 'fullday', time: 'Full-day', amount: '$700', deposit: '$350', totalNum: 700, depositNum: 350, label: 'Full-day — $700 (Deposit: $350)' },
  { id: '2days', time: '2days', amount: '$700', deposit: '$350', totalNum: 700, depositNum: 350, label: '2days — $700 (Deposit: $350)' },
  { id: 'weekend', time: 'Week end', amount: '$1000', deposit: '$500', totalNum: 1000, depositNum: 500, label: 'Week end — $1000 (Deposit: $500)' },
  { id: 'threesome', time: 'threesome', amount: 'Ask for price', deposit: 'State deposit', totalNum: 0, depositNum: 0, label: 'threesome — Ask for price (State deposit)' },
]

export const therapists = [
  {
    id: 'emily',
    name: 'Emily Carter',
    desc: 'Professional bodywork and massage sessions focused on relaxation and stress relief.',
    accent: '#71846A',
    gallery: { main: '#DCE3D2', thumb1: '#CFDAC1', thumb2: '#E4EBD9' },
    sessions: sessionRates,
    payment: {
      chime: '$EmilyCarter',
      zelle: 'emily.carter@grovestone.co',
      venmo: '@Emily-Carter',
      btc: 'bc1q05c8e4sulcm90us0zcwyfaqxx4y9vfvczx2zg8',
    },
  },
  {
    id: 'sarah',
    name: 'Sarah Mitchell',
    desc: 'Relaxing therapeutic sessions tailored to help you feel refreshed and balanced.',
    accent: '#B97B6D',
    tint: true,
    gallery: { main: '/Sarah1.jpeg', thumb1: '/Sarah2.jpeg', thumb2: '/Sarah3.jpeg' },
    sessions: sessionRates,
    payment: {
      chime: '$SarahMitchell',
      zelle: 'sarah.mitchell@grovestone.co',
      venmo: '@Sarah-Mitchell',
      btc: 'bc1q05c8e4sulcm90us0zcwyfaqxx4y9vfvczx2zg8',
    },
  },
  {
    id: 'rachel',
    name: 'Rachel Bennett',
    desc: 'College students girl seeking for FWB and creampie',
    accent: '#9AAE8A',
    gallery: { main: '/Rachel1.jpeg', thumb1: '/Rachel2.jpeg', thumb2: '/Rachel4.jpeg.jpeg' },
    sessions: sessionRates,
    payment: {
      chime: '$RachelBennett',
      zelle: 'rachel.bennett@grovestone.co',
      venmo: '@Rachel-Bennett',
      btc: 'bc1q05c8e4sulcm90us0zcwyfaqxx4y9vfvczx2zg8',
    },
  },
]
