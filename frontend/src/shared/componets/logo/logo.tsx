import styles from './logo.module.css'

import BeerLogo from '@/ui/assets/BeerHouseLogo.png'

interface logoValue {
    className?: string;
    withName?: boolean;
    withImg?: boolean;
}

export const Logo = ({
    className,
    withName = true,
    withImg = true
}: logoValue) => {
    return (
        <div className={`${styles.Logo} ${className}`.trim()}>
            {withImg &&
                <div className={styles.contentImg}>
                    <img src={BeerLogo} alt="Logo oficial de beer house" />
                </div>
            }

            {withName && 
                <div className={styles.contentText}>
                    <span>BEER</span>
                    <span>HOUSE</span>
                </div>
            }
        </div>
    )
}