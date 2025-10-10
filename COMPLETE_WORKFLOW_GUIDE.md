# Complete Founder Submission Workflow Guide

## 🚀 The Complete Journey

This is the complete, production-ready workflow for founders submitting their pitch decks to investors.

---

## 📋 Step-by-Step User Flow

### Step 0: Registration
```
📝 SignUpPage.tsx
↓
Founder creates account
- Email & password
- First name, Last name
- Company name
- Phone number
↓
✅ User account created in auth.users
✅ Company record created in companies table
✅ companyId saved in sessionStorage
↓
Navigate to /submit-pitch-deck
```

---

### Step 1: Upload Pitch Deck
```
📤 FounderSubmission.tsx (currentStep='upload')
↓
UI Shows:
┌────────────────────────────────────┐
│ [⭕ 1] ──── [○ 2] ──── [○ 3] ──── [○ 4] │
│ Upload   AI      Details  Investors │
│                                     │
│ Upload Your Pitch Deck             │
│                                     │
│ [Drag & Drop Area]                 │
│ or click to browse                 │
│                                     │
│ Selected: pitch-deck.pdf           │
│ [📊 Continue]                      │
└────────────────────────────────────┘
↓
Founder clicks "Continue"
↓
Triggers analyzePitchDeck()
```

---

### Step 2: AI Analysis (Automatic)
```
🤖 FounderSubmission.tsx (currentStep='analyze')
↓
Backend Processing:
1. Upload pitch-deck.pdf to storage
   → company-documents/company-uuid/pitch-deck.pdf
   
2. Save document record
   → documents table entry created
   
3. Call analyze-pdf edge function
   → POST /functions/v1/analyze-pdf
   
4. OpenAI GPT-4 Turbo analyzes PDF
   → Extracts: name, industry, description, team, funding, etc.
   
5. Pre-fill company form
   → setCompanyData() with extracted values
   → setAnalysisResult() for badge tracking
   
6. Move to company step
   → setCurrentStep('company')
↓
UI Shows:
┌────────────────────────────────────┐
│ [✓ 1] ──── [⭕ 2] ──── [○ 3] ──── [○ 4] │
│ Upload   AI      Details  Investors │
│                                     │
│ 🔄 Analyzing Your Pitch Deck       │
│                                     │
│ ✓ Uploading pitch deck             │
│ ✓ Analyzing with GPT-4 Turbo       │
│ ✓ Extracting company details       │
│ ⏳ This usually takes 30-60 secs   │
│                                     │
│ ● ● ● (animated dots)              │
└────────────────────────────────────┘
↓
30-60 seconds later...
↓
Success! Move to Step 3
```

---

### Step 3: Review/Edit Company Details
```
📝 FounderSubmission.tsx (currentStep='company')
↓
UI Shows:
┌────────────────────────────────────┐
│ [✓ 1] ──── [✓ 2] ──── [⭕ 3] ──── [○ 4] │
│ Upload   AI      Details  Investors │
│                                     │
│ Company Information [AI Pre-filled]│
│                                     │
│ Company Name * ✓ AI Extracted      │
│ [DAC                           ]   │
│                                     │
│ Industry ✓ AI Extracted            │
│ [AI-powered Analytics          ]   │
│                                     │
│ Description ✓ AI Extracted         │
│ [AI platform for data analysis...]│
│                                     │
│ Funding Sought ✓ AI Extracted      │
│ [$2M Seed Round                ]   │
│                                     │
│ Revenue ✓ AI Extracted             │
│ [$500K ARR                     ]   │
│                                     │
│ ... more fields ...                │
│                                     │
│ [📤 Submit Company Information]    │
└────────────────────────────────────┘
↓
Founder reviews and edits as needed
↓
Clicks "Submit Company Information"
↓
Triggers handleSubmit()
```

---

### Step 4: Select Investors ✨ NEW!
```
👥 InvestorSelection.tsx (currentStep='investors')
↓
Backend Processing:
1. Update company record with edited data
   → UPDATE companies SET ... WHERE id = companyId
   
2. Upload additional files (if any)
   → company-documents bucket
   
3. Save companyId to state
   → setSavedCompanyId(companyId)
   
4. Move to investors step
   → setCurrentStep('investors')
↓
UI Shows:
┌────────────────────────────────────┐
│ [✓ 1] ──── [✓ 2] ──── [✓ 3] ──── [⭕ 4] │
│ Upload   AI      Details  Investors │
│                                     │
│ Select Investors                   │
│ Choose which investors to submit to│
│                                     │
│ 2 investors selected               │
│                                     │
│ ┌──────────────────────────────┐  │
│ │ ✓ Sarah Chen                 │  │
│ │   TechVentures Capital       │  │
│ │   🎯 SaaS, AI, Enterprise   │  │
│ │   📧 sarah@techventures.com  │  │
│ └──────────────────────────────┘  │
│                                     │
│ ┌──────────────────────────────┐  │
│ │ ✓ David Kim                  │  │
│ │   Quantum Ventures           │  │
│ │   🎯 Deep Tech, Quantum      │  │
│ │   📧 david@quantumvc.com     │  │
│ └──────────────────────────────┘  │
│                                     │
│ ┌──────────────────────────────┐  │
│ │ ○ Emily Thompson             │  │
│ │   Growth Equity Fund         │  │
│ │   🎯 E-commerce, Consumer    │  │
│ └──────────────────────────────┘  │
│                                     │
│ [Submit to 2 Investors] [Cancel]   │
└────────────────────────────────────┘
↓
Founder selects investors (multi-select)
↓
Clicks "Submit to X Investors"
↓
Creates analysis table entries
```

---

### Step 5: Completion & Navigation
```
✅ Success!
↓
Database Creates:
- analysis entry for DAC + Sarah Chen (status: 'submitted')
- analysis entry for DAC + David Kim (status: 'submitted')
- message entry: "Pitch Deck Submitted"
↓
Success message shows
↓
Navigate to /founder-dashboard
↓
✅ COMPLETE!
```

---

## 🎯 What Happens in Each Step

### Step 1: Upload (5 seconds)
- **User Action**: Upload file
- **System Action**: Validate file type
- **Database**: Nothing yet
- **Storage**: Nothing yet
- **Next**: Click Continue

### Step 2: AI Analysis (30-60 seconds)
- **User Action**: Wait
- **System Action**: 
  - Upload to storage ✓
  - Save to database ✓
  - Call OpenAI API ✓
  - Extract data ✓
  - Pre-fill form ✓
- **Database**: documents table entry
- **Storage**: pitch-deck.pdf uploaded
- **Next**: Automatic → Step 3

### Step 3: Review/Edit (2-5 minutes)
- **User Action**: Review & edit fields
- **System Action**: Show pre-filled form with badges
- **Database**: Nothing yet (just displaying)
- **Storage**: Nothing new
- **Next**: Click Submit Company Information

### Step 4: Select Investors (30 seconds - 2 minutes)
- **User Action**: Select 1+ investors
- **System Action**: 
  - Update company record ✓
  - Upload additional files ✓
  - Display investor list ✓
- **Database**: companies table updated
- **Storage**: Additional files uploaded (if any)
- **Next**: Click Submit to X Investors

### Step 5: Finalize (< 1 second)
- **User Action**: Wait briefly
- **System Action**: 
  - Create analysis entries ✓
  - Create welcome message ✓
  - Navigate to dashboard ✓
- **Database**: 
  - N analysis entries (N = investors selected)
  - 1 message entry
- **Storage**: Nothing new
- **Next**: Dashboard loaded

---

## 📊 Database State After Complete Flow

### Example: Founder submits DAC to 2 investors

**companies table:**
```
id: 'dac-uuid'
name: 'DAC'
industry: 'AI-powered Analytics'
description: 'AI platform for...'
user_id: 'founder-uuid'
// ... all other fields filled
```

**documents table:**
```
id: 'doc-1'
company_id: 'dac-uuid'
filename: 'dac-pitch-deck.pdf'
document_name: 'Pitch Deck'
path: 'dac-uuid/dac-pitch-deck.pdf'
```

**extracted_data table:**
```
id: 'extract-1'
file_path: 'dac-uuid/dac-pitch-deck.pdf'
extracted_info: {
  company_name: 'DAC',
  industry: 'AI-powered Analytics',
  description: '...',
  // ... all extracted fields
}
```

**analysis table:** ← Created in Step 4!
```
id: 'analysis-1'
company_id: 'dac-uuid'
investor_user_id: 'sarah-uuid'
status: 'submitted'

id: 'analysis-2'
company_id: 'dac-uuid'
investor_user_id: 'david-uuid'
status: 'submitted'
```

**messages table:**
```
id: 'msg-1'
company_id: 'dac-uuid'
recipient_id: 'founder-uuid'
message_title: 'Pitch Deck Submitted'
message_status: 'unread'
```

---

## 🎨 Visual Progress

```
Step 1: Upload
[🟠━━━━○━━━━○━━━━○]
 Upload  AI   Details Invest

Step 2: AI Analysis  
[✅━━━━🟠━━━━○━━━━○]
 Upload  AI   Details Invest

Step 3: Company Details
[✅━━━━✅━━━━🟠━━━━○]
 Upload  AI   Details Invest

Step 4: Select Investors
[✅━━━━✅━━━━✅━━━━🟠]
 Upload  AI   Details Invest

Complete!
[✅━━━━✅━━━━✅━━━━✅]
 Upload  AI   Details Invest
```

---

## 🚦 Decision Points

### Can Founder Go Back?
- From Step 3 to Step 2: ❌ No (AI already ran)
- From Step 4 to Step 3: ✅ Yes (Cancel button)
- After submission: ❌ No (use Edit Company feature)

### Can Founder Skip Steps?
- Skip Upload: ❌ No (Required)
- Skip AI Analysis: ❌ No (Automatic)
- Skip Company Details: ❌ No (Required)
- Skip Investor Selection: ❌ No (Required)

### What If AI Fails?
- ✅ Shows error message
- ✅ Moves to company form
- ✅ Form is empty (manual entry)
- ✅ Can still complete submission

---

## 🎯 Success Criteria

### Workflow is Successful When:
- ✅ Founder can complete all 4 steps
- ✅ AI extracts data accurately (>80% fields)
- ✅ Form shows green badges on extracted fields
- ✅ Can edit extracted data
- ✅ Can select multiple investors
- ✅ Analysis entries created correctly
- ✅ Navigates to dashboard after completion
- ✅ No errors during happy path
- ✅ Graceful error handling for edge cases

---

## 🎓 Key Learnings

### Why This Flow Works
1. **Progressive Disclosure**: One step at a time
2. **AI Assistance**: Saves time, reduces errors
3. **Human Oversight**: Founder reviews everything
4. **Targeted Distribution**: Choose specific investors
5. **Clear Progress**: Always know where you are
6. **Flexibility**: Can go back if needed
7. **Validation**: Required fields enforced

### UX Best Practices Applied
- ✅ Clear visual hierarchy
- ✅ Consistent color coding (orange = current, green = done)
- ✅ Loading indicators
- ✅ Success/error feedback
- ✅ Helpful placeholder text
- ✅ Responsive design
- ✅ Accessible buttons
- ✅ Logical flow

---

## 🎉 Implementation Complete!

The investor selection step is now fully integrated. The workflow is:

**4 Steps. 5-10 minutes. Multiple investors. One smooth experience.**

1. **Upload** → 2. **AI Analyzes** → 3. **Review/Edit** → 4. **Select Investors** → Dashboard

**Status: ✅ READY TO USE**

---

**Last Updated:** October 9, 2025  
**Version:** 2.0.0  
**Implementation:** Complete ✅
