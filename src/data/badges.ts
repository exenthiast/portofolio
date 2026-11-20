import { content } from './content'
import { splitCredentials } from './credentials'

export const { badges: badgesData, certificates: certificatesData } = splitCredentials(content.badges)
