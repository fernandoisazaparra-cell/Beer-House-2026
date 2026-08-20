import styles from './registre.module.css'

import BackgroundRegistre from '@/ui/assets/BackgroundRegistre.jpg'

import {
    RegistreForm
} from './registreForm/registreForm'

export const Registre = () => {
    return (
        <section className={styles.seccion}>
            <img src={BackgroundRegistre} alt="Fondo del registre" className={styles.background}/>
        
            <div className={styles.contentForm}>
                <RegistreForm />
            </div>
        </section>
    )
}