/**
 * Check whether it is between the dates of 4/1 and 4/7
 * @returns true or false based on whether it is april fools week
 */
export function IsAprilFools() {
    const date = new Date();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // april fools changes will take effect for one week.
    return (month == 4 && day < 8);
}