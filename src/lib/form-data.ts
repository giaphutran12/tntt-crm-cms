export function getCheckedFormValue(formData: FormData, key: string) {
  const values = formData.getAll(key);

  if (values.length === 0) {
    return false;
  }

  return values.some((value) => {
    if (typeof value !== "string") {
      return true;
    }

    const normalized = value.trim().toLowerCase();

    return normalized === "on" || normalized === "true" || normalized === "1" || normalized === "yes";
  });
}
