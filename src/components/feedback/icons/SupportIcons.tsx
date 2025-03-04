
import { IconSvgProps } from "@/types";

export const BugReport = ({ strokeWidth = 0.1, ...otherProps }: IconSvgProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            aria-hidden="true"
            focusable="false"
            width="1em"
            height="1em"
            className="inline-block"
            {...otherProps}
        >
            <path
                d="M480-200q66 0 113-47t47-113v-160q0-66-47-113t-113-47q-66 0-113 47t-47 113v160q0 66 47 113t113 47Zm-80-120h160v-80H400v80Zm0-160h160v-80H400v80Zm80 40Zm0 320q-65 0-120.5-32T272-240H160v-80h84q-3-20-3.5-40t-.5-40h-80v-80h80q0-20 .5-40t3.5-40h-84v-80h112q14-23 31.5-43t40.5-35l-64-66 56-56 86 86q28-9 57-9t57 9l88-86 56 56-66 66q23 15 41.5 34.5T688-640h112v80h-84q3 20 3.5 40t.5 40h80v80h-80q0 20-.5 40t-3.5 40h84v80H688q-32 56-87.5 88T480-120Z"
                className="fill-black dark:fill-white"
                strokeMiterlimit={10}
                strokeWidth={strokeWidth}
            />
        </svg>

    );
};

export const Lightbulb = ({ strokeWidth = 0.1, ...otherProps }: IconSvgProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            aria-hidden="true"
            focusable="false"
            width="1em"
            height="1em"
            className="inline-block"
            {...otherProps}
        >
            <path
                d="M480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80M320-200v-80h320v80zm10-120q-69-41-109.5-110T180-580q0-125 87.5-212.5T480-880t212.5 87.5T780-580q0 81-40.5 150T630-320zm24-80h252q45-32 69.5-79T700-580q0-92-64-156t-156-64-156 64-64 156q0 54 24.5 101t69.5 79m126 0"
                className="fill-black dark:fill-white"
                strokeMiterlimit={10}
                strokeWidth={strokeWidth}
            />
        </svg>

    );
};

export const Feedback = ({ strokeWidth = 0.1, ...otherProps }: IconSvgProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            aria-hidden="true"
            focusable="false"
            width="1em"
            height="1em"
            className="inline-block"
            {...otherProps}
        >
            <path
                d="M480-360q17 0 28.5-11.5T520-400t-11.5-28.5T480-440t-28.5 11.5T440-400t11.5 28.5T480-360m-40-160h80v-240h-80zM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240zm126-240h594v-480H160v525zm-46 0v-480z"
                className="fill-black dark:fill-white"
                strokeMiterlimit={10}
                strokeWidth={strokeWidth}
            />
        </svg>

    );
};

export const Help = ({ strokeWidth = 0.1, ...otherProps }: IconSvgProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            aria-hidden="true"
            focusable="false"
            width="1em"
            height="1em"
            className="inline-block"
            {...otherProps}
        >
            <path
                d="M478-240q21 0 35.5-14.5T528-290t-14.5-35.5T478-340t-35.5 14.5T428-290t14.5 35.5T478-240m-36-154h74q0-33 7.5-52t42.5-52q26-26 41-49.5t15-56.5q0-56-41-86t-97-30q-57 0-92.5 30T342-618l66 26q5-18 22.5-39t53.5-21q32 0 48 17.5t16 38.5q0 20-12 37.5T506-526q-44 39-54 59t-10 73m38 314q-83 0-156-31.5T197-197t-85.5-127T80-480t31.5-156T197-763t127-85.5T480-880t156 31.5T763-763t85.5 127T880-480t-31.5 156T763-197t-127 85.5T480-80m0-80q134 0 227-93t93-227-93-227-227-93-227 93-93 227 93 227 227 93m0-320"
                className="fill-black dark:fill-white"
                strokeMiterlimit={10}
                strokeWidth={strokeWidth}
            />
        </svg>

    );
};