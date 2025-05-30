import { useTranslation } from "next-i18next";
import { useState } from "react";
import { MdLocationDisabled, MdLocationSearching } from "react-icons/md";
import { WiCloudDown } from "react-icons/wi";
import useSWR from "swr";

import mapIcon from "../../../utils/weather/owm-condition-map";
import Container from "../widget/container";
import ContainerButton from "../widget/container_button";
import Error from "../widget/error";
import PrimaryText from "../widget/primary_text";
import SecondaryText from "../widget/secondary_text";
import WidgetIcon from "../widget/widget_icon";

function Widget({ options }) {
  const { t, i18n } = useTranslation();

  const { data, error } = useSWR(
    `/api/widgets/openweathermap?${new URLSearchParams({ lang: i18n.language, ...options }).toString()}`,
  );

  if (error || data?.cod === 401 || data?.error) {
    return <Error options={options} />;
  }

  if (!data) {
    return (
      <Container options={options} additionalClassNames="information-widget-openweathermap">
        <PrimaryText>{t("weather.updating")}</PrimaryText>
        <SecondaryText>{t("weather.wait")}</SecondaryText>
        <WidgetIcon icon={WiCloudDown} size="l" />
      </Container>
    );
  }

  const unit = options.units === "metric" ? "celsius" : "fahrenheit";

  const condition = data.weather[0].id;
  const timeOfDay = data.dt > data.sys.sunrise && data.dt < data.sys.sunset ? "day" : "night";

  return (
    <Container options={options} additionalClassNames="information-widget-openweathermap">
      <PrimaryText>
        {options.label && `${options.label}, `}
        {t("common.number", { value: data.main.temp, style: "unit", unit, ...options.format })}
      </PrimaryText>
      <SecondaryText>{data.weather[0].description}</SecondaryText>
      <WidgetIcon icon={mapIcon(condition, timeOfDay)} size="xl" />
    </Container>
  );
}

export default function OpenWeatherMap({ options }) {
  const { t } = useTranslation();
  const [location, setLocation] = useState(false);
  const [requesting, setRequesting] = useState(false);

  if (!location && options.latitude && options.longitude) {
    setLocation({ latitude: options.latitude, longitude: options.longitude });
  }

  const requestLocation = () => {
    setRequesting(true);
    if (typeof window !== "undefined") {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          setRequesting(false);
        },
        () => {
          setRequesting(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000 * 60 * 60 * 3,
          timeout: 1000 * 30,
        },
      );
    }
  };

  if (!location) {
    return (
      <ContainerButton options={options} callback={requestLocation}>
        <PrimaryText>{t("weather.current")}</PrimaryText>
        <SecondaryText>{t("weather.allow")}</SecondaryText>
        <WidgetIcon icon={requesting ? MdLocationSearching : MdLocationDisabled} size="m" pulse />
      </ContainerButton>
    );
  }

  return <Widget options={{ ...location, ...options }} />;
}
