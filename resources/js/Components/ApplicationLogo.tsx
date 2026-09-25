import { SVGAttributes } from 'react';

export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return (
        <img src="/img/logo_pitazo.png" alt="Pitazo Final" className={props.className} style={{ objectFit: 'contain' }} />
    );
}
