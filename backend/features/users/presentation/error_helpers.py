from pydantic import ValidationError

MENSAJES_CAMPO = {
    ('email', 'value_error'): 'El email no tiene un formato válido',
}

def traducir_errores_pydantic(validation_error: ValidationError) -> dict[str, list[str]]:
    errores = {}
    
    for err in validation_error.errors():
        campo = err['loc'][0]
        tipo = err['type']

        mensaje = MENSAJES_CAMPO.get((campo, tipo), f'{campo}: {err["msg"]}')
        errores.setdefault(campo, []).append(mensaje)

    return errores


def formatear_respuesta_errores(errores: dict[str, list[str]]) -> tuple[dict, int]:
    return {'errors': errores}, 400

def formatear_respuesta_mensaje(mensaje: str, status: int = 400) -> tuple[dict, int]:
    return {'message': mensaje}, status