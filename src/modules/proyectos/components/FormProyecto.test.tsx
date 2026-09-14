import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { FormProyecto } from './FormProyecto';
const mocks=vi.hoisted(()=>({guardar:vi.fn(),navigate:vi.fn(),success:vi.fn()}));
vi.mock('@tanstack/react-router',()=>({useNavigate:()=>mocks.navigate,Link:({children}:{children:React.ReactNode})=><span>{children}</span>}));
vi.mock('../api/guardarProyecto',()=>({guardarProyecto:mocks.guardar,errorProyecto:()=> 'Error del servidor'}));
vi.mock('@heroui/react/toast',()=>({toast:{success:mocks.success}}));
beforeEach(()=>vi.clearAllMocks());afterEach(cleanup);
function mount(){render(<QueryClientProvider client={new QueryClient()}><FormProyecto/></QueryClientProvider>);for(const [label,value] of [['Nombre','Obra prueba'],['Cliente','Cliente prueba'],['Fecha de inicio','2026-09-14'],['Fecha de fin','2026-09-30']]){fireEvent.change(screen.getByLabelText(new RegExp(label)),{target:{value}});}}
describe('Creacion directa de proyectos',()=>{
 it('exige al menos un contacto sin enviar la solicitud',()=>{mount();fireEvent.click(screen.getByRole('button',{name:'Guardar proyecto'}));expect(screen.getByRole('alert').textContent).toContain('teléfono o correo');expect(mocks.guardar).not.toHaveBeenCalled();});
 it('crea con correo solamente y navega al detalle',async()=>{mocks.guardar.mockResolvedValue({id:42});mount();fireEvent.change(screen.getByLabelText('Correo'),{target:{value:'cliente@example.com'}});fireEvent.click(screen.getByRole('button',{name:'Guardar proyecto'}));await waitFor(()=>expect(mocks.navigate).toHaveBeenCalledWith({to:'/proyectos/$proyectoId',params:{proyectoId:'42'}}));expect(mocks.guardar).toHaveBeenCalledWith(expect.objectContaining({phone:'',email:'cliente@example.com'}),undefined);});
 it('conserva el formulario y no anuncia exito ante error',async()=>{mocks.guardar.mockRejectedValue(new Error('fallo'));mount();fireEvent.change(screen.getByLabelText('Teléfono'),{target:{value:'70000000'}});fireEvent.click(screen.getByRole('button',{name:'Guardar proyecto'}));await screen.findByText('Error del servidor');expect(mocks.navigate).not.toHaveBeenCalled();expect(mocks.success).not.toHaveBeenCalled();expect(screen.getByLabelText<HTMLInputElement>('Teléfono').value).toBe('70000000');});
});
