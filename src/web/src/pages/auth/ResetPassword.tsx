import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { IconSun, IconMoon, IconEye, IconEyeOff } from '@tabler/icons-react'
import { useThemeStore } from '../../store/useThemeStore'
import { authService } from '../../services/authService'
import { getAuthErrorMessage } from '../../utils/authErrors'

