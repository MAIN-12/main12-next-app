import { IconSvgProps } from "@/types";

const BackArrowIcon = ({ strokeWidth = 0.1, ...otherProps }: IconSvgProps) => {
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
            width="1.5em"
            height="1.5em"
            className="inline-block"
            {...otherProps}
        >
            <path
                d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"
                className="fill-black dark:fill-white"
                strokeMiterlimit={10}
                strokeWidth={strokeWidth}
            />
        </svg>
    );
};

export default BackArrowIcon;
