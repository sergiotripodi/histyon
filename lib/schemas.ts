import { z } from 'zod'
import { REGEX_VALIDATORS } from './constants'
import { dictionary } from '@/lib/dictionary'

export const PasswordSchema = z.string()
  .min(8, dictionary.validation.passwordLength)
  .regex(new RegExp(REGEX_VALIDATORS.PASSWORD), dictionary.validation.passwordRegexMsg)

export const PatientSchema = z.object({
  firstName: z.string().min(2).regex(new RegExp(REGEX_VALIDATORS.NAME), dictionary.validation.nameAllowed),
  lastName: z.string().min(2).regex(new RegExp(REGEX_VALIDATORS.NAME), dictionary.validation.nameAllowed),
  fiscalCode: z.string().length(16).regex(new RegExp(REGEX_VALIDATORS.FISCAL_CODE), dictionary.validation.fiscalCodeFormat),
  email: z.string().email().optional().or(z.literal('')),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), 
  gender: z.enum(['M', 'F', 'OTHER']),
  country: z.string().optional(),
  placeOfBirth: z.string().optional(),
  addressStreet: z.string().optional(),
  addressCivic: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
})

const optionalIntlPhone = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : String(v).trim()),
  z
    .string()
    .min(5, dictionary.validation.phoneShort)
    .max(48)
    .regex(/^\+[\d\s\-().]+$/, dictionary.validation.phoneShort)
    .optional()
)

export const DoctorRegistrationSchema = z.object({
  firstName: z.string().min(2).regex(new RegExp(REGEX_VALIDATORS.NAME)),
  lastName: z.string().min(2).regex(new RegExp(REGEX_VALIDATORS.NAME)),
  fiscalCode: z.string().length(16).regex(new RegExp(REGEX_VALIDATORS.FISCAL_CODE)),
  gender: z.enum(['M', 'F']),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  placeOfBirth: z.string().min(2),
  phone: optionalIntlPhone,
  country: z.string().min(2),
  addressStreet: z.string().min(2),
  addressCivic: z.string().min(1),
  postalCode: z.string().min(2),
  city: z.string().min(2),
  region: z.string().min(2),
  medicalLicense: z.string().min(2),
  hospitalName: z.string().min(2),
  email: z.string().email(),
  password: PasswordSchema
})