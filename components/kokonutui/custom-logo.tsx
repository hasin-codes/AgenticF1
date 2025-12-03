import Image from "next/image";
import type { HTMLProps, ComponentProps } from "react";

type CustomLogoProps = Omit<HTMLProps<HTMLImageElement>, keyof ComponentProps<typeof Image>> &
    Partial<ComponentProps<typeof Image>>;

const CustomLogo = (props: CustomLogoProps) => {
    const { style, ...restProps } = props;
    
    return (
        <Image
            src="/Logo/Logo.svg"
            alt="F1 Tele"
            width={16}
            height={16}
            style={{
                flex: "none",
                lineHeight: 1,
                height: "1em",
                width: "1em",
                ...style,
            }}
            {...restProps}
        />
    );
};

export default CustomLogo;