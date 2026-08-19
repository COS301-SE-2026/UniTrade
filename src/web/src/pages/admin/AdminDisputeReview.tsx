import {useEffect , useState} from 'react'
import {useNavigate, useParams} from 'react-router'
import {IconCircleCheck, IconCircleX, IconMail} from '@tabler/icons-react'
import {
    Breadcrumb, 
    InfoRow, 
    Panel, 
    PersonCard, 
    StatusBadge, 
    DecisionButton,
    OutlineButton,
    NotesPanel,
} from './AdminReviewShared'
import {getMockDisputeById, type DisputeCase, type DisputeDecision} from '../../types/mockAdmin'